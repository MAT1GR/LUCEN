import { Request, Response } from 'express';
import { db } from '../lib/database.js';
import { sendMetaConversionEvent } from '../lib/metaConversionService.js';
import { hashSha256 } from '../lib/utils.js';

export const createOrder = async (req: Request, res: Response) => {
    try {
        // --- CORRECCIÓN AQUÍ ---
        // Se añaden customerName, customerEmail y se renombra totalAmount a total
        const { customerId, customerName, customerEmail, items, shipping, shippingDetails, paymentMethod, total, status = 'pending' } = req.body;
        const shippingMethod = shipping?.id || req.body.shippingMethod || 'unknown';

        // Se añaden a la validación
        if (!customerId || !customerName || !customerEmail || !items || !shippingMethod || !paymentMethod || !total) {
            return res.status(400).json({ message: 'Faltan campos obligatorios para crear el pedido.' });
        }

        const newOrder = {
            customerId,
            customerName, // Añadido
            customerEmail, // Añadido
            items,
            shippingAddress: shipping?.name || 'No especificado',
            shippingMethod,
            shippingDetails, // Añadido
            paymentMethod,
            total, // Renombrado
            status,
            createdAt: new Date(),
        };

        const orderId = db.orders.create(newOrder); 
        res.status(201).json({ message: 'Pedido creado exitosamente', orderId });

        // ---------------------------------------------------------
        // 2. AQUÍ SE DEFINE EL CONTENIDO Y EL ENVÍO (Lógica "Cuándo")
        // ---------------------------------------------------------
        const emailSubject = `Confirmación de Pedido #${orderId}`;
        
        // Aquí defines el contenido HTML del correo
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>¡Gracias por tu compra, ${newOrder.customerName}!</h1>
                <p>Hemos recibido tu pedido correctamente.</p>
                <h3>Detalles del pedido #${orderId}:</h3>
                <ul>
                    ${newOrder.items.map((item: any) => `
                        <li>${item.name} x ${item.quantity} - $${item.price}</li>
                    `).join('')}
                </ul>
                <p><strong>Total: $${newOrder.total}</strong></p>
                <hr/>
                <p>Dirección de envío: ${newOrder.shippingAddress}</p>
                <p>Te avisaremos cuando salga en camino.</p>
            </div>
        `;

        // Ejecutar el envío (no usamos await para no frenar la respuesta al usuario)
        sendEmail(newOrder.customerEmail, emailSubject, emailHtml);
        
        // También puedes enviarte una copia a ti mismo (al correo de ventas)
        sendEmail('ventas@denimrosario.com.ar', `Nuevo Pedido Recibido #${orderId}`, `<h1>Nueva venta de $${newOrder.total}</h1><p>Cliente: ${newOrder.customerName}</p>`);
        // ---------------------------------------------------------

        // --- Send Meta Conversion API Purchase Event ---
        try {
            const hashedEmail = customerEmail ? hashSha256(customerEmail) : undefined;
            const clientIpAddress = req.ip;
            const clientUserAgent = req.headers['user-agent'];

            const purchaseEvent = {
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000), // Unix timestamp
                action_source: 'website',
                user_data: {
                    em: hashedEmail ? [hashedEmail] : undefined,
                    client_ip_address: clientIpAddress,
                    client_user_agent: clientUserAgent,
                },
                custom_data: {
                    currency: 'USD', // Assuming USD, adjust as needed
                    value: total,
                    content_ids: items.map((item: any) => item.productId), // Assuming items have a productId
                },
            };
            await sendMetaConversionEvent(purchaseEvent);
        } catch (metaError) {
            console.error('Error sending Meta Conversion API event:', metaError);
            // Do not block the order creation response if Meta event fails
        }

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: 'Error al crear el pedido' });
    }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { status, searchTerm, page } = req.query;

        const filters = {
            status: status as string | undefined,
            searchTerm: searchTerm as string | undefined,
            page: page ? parseInt(page as string, 10) : 1,
        };

        const result = db.orders.getAll(filters);
        res.json(result);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: 'Error al obtener los pedidos' });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        // 1. Actualizamos el estado en la BD
        const updated = db.orders.updateStatus(orderId, status);
        
        if (updated) {
            // 2. Buscamos la orden para saber el mail y el tipo de envío
            const order = db.orders.getById(orderId);
            
            if (order && order.customerEmail) {
                let subject = `Actualización de pedido #${orderId}`;
                let htmlBody = `<p>El estado de tu pedido es ahora: <strong>${status}</strong>.</p>`;

                // --- LÓGICA DE CORREOS INTELIGENTES ---
                if (status === 'shipped') { // Cuando pasas a "Enviado" / "Preparado"
                    
                    // Detectamos si es Cadete por el ID o si el detalle tiene formato de fecha (ej: "Lunes 12/8")
                    const isRosarioCadete = (order as any).shippingMethod === 'cadete' || (order.shippingDetails && order.shippingDetails.includes('/'));

                    if (isRosarioCadete) {
                        // CASO 1: ROSARIO (CADETE)
                        // No decimos "ya salió", sino "te llega tal día"
                        subject = `¡Tu pedido llega el ${order.shippingDetails}! 🛵`;
                        htmlBody = `
                            <div style="font-family: sans-serif; color: #333;">
                                <h1>¡Todo listo! ✅</h1>
                                <p>Hola <strong>${order.customerName}</strong>,</p>
                                <p>Tu pedido está preparado y confirmado para ser entregado el día:</p>
                                <h2 style="color: #000; background: #eee; padding: 10px; display: inline-block;">${order.shippingDetails}</h2>
                                <p>Recordá que el cadete pasará en el rango horario correspondiente a ese día.</p>
                                <hr/>
                                <p style="font-size: 12px; color: #666;">Si necesitas cambiar algo, avísanos cuanto antes.</p>
                            </div>
                        `;
                    } else {
                        // CASO 2: CORREO ARGENTINO (O RESTO DEL PAÍS)
                        // Aquí sí decimos "está en camino"
                        subject = `¡Tu pedido está en camino! 🚚`;
                        htmlBody = `
                            <div style="font-family: sans-serif; color: #333;">
                                <h1>¡Buenas noticias!</h1>
                                <p>Tu pedido ya fue despachado por correo.</p>
                                <p><strong>Método:</strong> ${order.shippingDetails}</p>
                                <p>Pronto recibirás (o ya tienes) el código de seguimiento para ver dónde está.</p>
                                <hr/>
                                <p>¡Que lo disfrutes!</p>
                            </div>
                        `;
                    }
                } else if (status === 'cancelled') {
                    subject = `Aviso sobre tu pedido #${orderId}`;
                    htmlBody = `<p>El pedido ha sido cancelado. Por favor contáctanos si crees que es un error.</p>`;
                } else if (status === 'delivered') {
                    subject = `¡Pedido Entregado! #${orderId} de ${order.customerName}`;
                    htmlBody = `
                        <div style="font-family: sans-serif; color: #333;">
                            <h1>¡Pedido Entregado! ✅</h1>
                            <p>El pedido <strong>#${orderId}</strong> de <strong>${order.customerName}</strong> ha sido marcado como entregado.</p>
                            <h3>Detalles del pedido:</h3>
                            <ul>
                                <li><strong>Cliente:</strong> ${order.customerName} (${order.customerEmail})</li>
                                <li><strong>Teléfono:</strong> ${order.customerPhone || 'N/A'}</li>
                                <li><strong>Dirección de Envío:</strong> ${order.shippingStreetName} ${order.shippingStreetNumber}, ${order.shippingCity}, ${order.shippingProvince}</li>
                                <li><strong>Método de Envío:</strong> ${order.shippingName} - ${order.shippingDetails}</li>
                                <li><strong>Método de Pago:</strong> ${order.paymentMethod}</li>
                                <li><strong>Total:</strong> $${order.total.toLocaleString('es-AR')}</li>
                            </ul>
                            <h4>Items:</h4>
                            <ul>
                                ${order.items.map((item: any) => `
                                    <li>${item.product.name} (Talle: ${item.size}) x ${item.quantity} - $${item.product.price}</li>
                                `).join('')}
                            </ul>
                            <hr/>
                            <p>Este es un aviso automático de que un pedido ha completado su ciclo.</p>
                        </div>
                    `;
                    sendEmail('grigomati@gmail.com', subject, htmlBody);
                }
                
                // Enviamos el correo
                sendEmail(order.customerEmail, subject, htmlBody);
            }

            res.json({ message: 'Estado del pedido actualizado y cliente notificado.' });
        } else {
            res.status(404).json({ message: 'Pedido no encontrado' });
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: 'Error al actualizar el estado del pedido' });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;
        const order = db.orders.getById(orderId);

        if (order) {
            // If the order is for a bank transfer, inject bank details from environment variables
            if (order.paymentMethod === 'transferencia') {
                const bankDetails = {
                    bank: process.env.TRANSFER_BANK_NAME,
                    cvu: process.env.TRANSFER_CVU,
                    alias: process.env.TRANSFER_ALIAS,
                    titular: process.env.TRANSFER_HOLDER_NAME,
                    cuit: process.env.TRANSFER_HOLDER_CUIT,
                };
                // Attach bank details to the order object being sent to the client
                (order as any).bankDetails = bankDetails;
            }
            res.json(order);
        } else {
            res.status(404).json({ message: 'Pedido no encontrado.' });
        }
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        res.status(500).json({ message: 'Error al obtener el pedido.' });
    }
};

export const getCustomerOrders = async (req: Request, res: Response) => {
    try {
        const orders = db.orders.getByCustomerId(req.params.id);
        res.json(orders);
    } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(500).json({ message: 'Error al obtener los pedidos del cliente' });
    }
};

export const cancelIfExpired = async (req: Request, res: Response) => {
    console.log(`[cancelIfExpired] Received request for order ${req.params.id}`);
    try {
        const orderId = req.params.id;
        const order = db.orders.getById(orderId);

        if (!order) {
            console.log(`[cancelIfExpired] Order ${orderId} not found.`);
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        console.log(`[cancelIfExpired] Found order ${orderId} with status ${order.status} and payment method ${order.paymentMethod}.`);

        if (order.paymentMethod !== 'transferencia' || order.status !== 'pending') {
            console.log(`[cancelIfExpired] Order ${orderId} is not a pending transfer. Aborting cancellation.`);
            return res.status(400).json({ message: 'El pedido no es una transferencia pendiente.' });
        }

        const fifteenMinutes = 15 * 60 * 1000;
        const orderTime = new Date(order.createdAt).getTime();
        const currentTime = new Date().getTime();

        if ((currentTime - orderTime) > fifteenMinutes) {
            console.log(`[cancelIfExpired] Order ${orderId} has expired. Proceeding with cancellation and stock restoration.`);
            db.products.restoreProductStock(order.items);
            db.orders.updateStatus(orderId, 'cancelled');
            const updatedOrder = db.orders.getById(orderId);
            console.log(`[cancelIfExpired] Order ${orderId} has been cancelled and stock restored.`);
            return res.json({ message: 'Pedido cancelado por expiración.', order: updatedOrder });
        }
        
        console.log(`[cancelIfExpired] Order ${orderId} has not expired yet.`);
        res.json({ message: 'El pedido aún no ha expirado.' });

    } catch (error) {
        console.error(`[cancelIfExpired] Error checking order expiration for ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al verificar la expiración del pedido.' });
    }
};

export const confirmPayment = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;
        const updated = db.orders.updateStatus(orderId, 'awaiting_confirmation');
        if (updated) {
            res.json({ message: 'El estado del pedido se ha actualizado a "en espera de confirmación".' });
        } else {
            res.status(404).json({ message: 'Pedido no encontrado' });
        }
    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ message: 'Error al confirmar el pago del pedido.' });
    }
};