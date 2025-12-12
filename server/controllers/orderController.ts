import { Request, Response } from 'express';
import { db } from '../lib/database.js';
import { sendMetaConversionEvent } from '../lib/metaConversionService.js';
import { hashSha256 } from '../lib/utils.js';
import { sendEmail, sendNewOrderAdminNotification } from '../emailService.js'; // Importa tu servicio de email
import { getShippedCadeteEmail, getShippedCorreoEmail, getOrderCancelledEmail, getOrderDeliveredAdminEmail, getOrderPaidEmail } from '../lib/emailTemplates.js';
import { Order, CartItem } from '../../types/index.js'; // Import Order and CartItem types

// Define a more specific type for order when shippingMethod is accessed
interface OrderWithShippingDetails extends Order {
    shippingMethod?: string; // It seems shippingMethod might be optional on the base Order type
    shippingName?: string; // Add shippingName as it's used in delivered status
}

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

                        // --- NEW: Admin Email Notification ---
                        if (orderId) {
                            sendNewOrderAdminNotification(newOrder, orderId).catch(console.error);
                        }
                        // --- END ---

                        res.status(201).json({ message: 'Pedido creado exitosamente', orderId });

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
                let htmlBody = `<p>El estado de tu pedido es ahora: <strong>${status}</strong>.</p>`; // Default fallback

                // --- LÓGICA DE CORREOS INTELIGENTES CON NUEVAS PLANTILLAS ---
                if (status === 'shipped') {
                    const typedOrder = order as OrderWithShippingDetails; // Use the specific type here
                    const isRosarioCadete = typedOrder.shippingMethod === 'cadete' || (typedOrder.shippingDetails && typedOrder.shippingDetails.includes('/'));

                    if (isRosarioCadete) {
                        subject = `¡Tu pedido llega el ${typedOrder.shippingDetails}! 🛵`;
                        htmlBody = getShippedCadeteEmail(typedOrder.customerName, orderId, typedOrder.shippingDetails || 'próximamente');
                    } else {
                        subject = `¡Tu pedido está en camino! 🚚`;
                        htmlBody = getShippedCorreoEmail(typedOrder.customerName, orderId, typedOrder.shippingDetails || 'sin seguimiento');
                    }
                } else if (status === 'cancelled') {
                    subject = `Aviso sobre tu pedido #${orderId}`;
                    htmlBody = getOrderCancelledEmail(order.customerName, orderId);
                } else if (status === 'paid') {
                    subject = `¡Confirmado! Tu pedido #${orderId} ya es tuyo 🎉`;
                    const itemsListHtml = `
                        <ul style="list-style: none; padding: 0;">
                            ${(order.items as CartItem[]).map((item) => `
                                <li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                                    <strong>${item.product.name}</strong> (Talle: ${item.size})
                                    <br>
                                    <span>${item.quantity} x $${item.product.price.toLocaleString('es-AR')}</span>
                                </li>
                            `).join('')}
                        </ul>
                    `;
                    htmlBody = getOrderPaidEmail(order.customerName, orderId, itemsListHtml);
                } else if (status === 'delivered') {
                    subject = `¡Pedido Entregado! #${orderId} de ${order.customerName}`;
                    const itemsListHtml = `
                        <ul style="list-style: none; padding: 0;">
                            ${(order.items as CartItem[]).map((item) => `
                                <li style="margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                                    <strong>${item.product.name}</strong> (Talle: ${item.size}) x ${item.quantity} - $${item.product.price.toLocaleString('es-AR')}
                                </li>
                            `).join('')}
                        </ul>
                    `;
                    htmlBody = getOrderDeliveredAdminEmail(
                        orderId,
                        order.customerName,
                        order.customerEmail,
                        order.customerPhone || 'N/A',
                        `${order.shippingStreetName} ${order.shippingStreetNumber}, ${order.shippingCity}, ${order.shippingProvince}`,
                        `${(order as OrderWithShippingDetails).shippingName} - ${order.shippingDetails}`,
                        order.paymentMethod,
                        order.total,
                        itemsListHtml
                    );
                    sendEmail('grigomati@gmail.com', subject, htmlBody); // Send to admin
                }
                
                // Only send to customer if it's not the admin-only delivered email
                if (status !== 'delivered') {
                    sendEmail(order.customerEmail, subject, htmlBody);
                }
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
                (order as Order & { bankDetails?: any }).bankDetails = bankDetails;
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