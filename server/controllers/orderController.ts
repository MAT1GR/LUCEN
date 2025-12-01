import { Request, Response } from 'express';
import { db } from '../lib/database.js';
import { sendMetaConversionEvent } from '../lib/metaConversionService.js';
import crypto from 'crypto'; // Import crypto for hashing

const hashSha256 = (value: string): string => {
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        // --- CORRECCIÓN AQUÍ ---
        // Se añaden customerName, customerEmail y se renombra totalAmount a total
        const { customerId, customerName, customerEmail, items, shippingAddress, shippingMethod, shippingDetails, paymentMethod, total, status = 'pending' } = req.body;

        // Se añaden a la validación
        if (!customerId || !customerName || !customerEmail || !items || !shippingAddress || !shippingMethod || !paymentMethod || !total) {
            return res.status(400).json({ message: 'Faltan campos obligatorios para crear el pedido.' });
        }

        const newOrder = {
            customerId,
            customerName, // Añadido
            customerEmail, // Añadido
            items,
            shippingAddress,
            shippingMethod,
            shippingDetails, // Añadido
            paymentMethod,
            total, // Renombrado
            status,
            createdAt: new Date(),
        };

        const orderId = db.orders.create(newOrder); // Assuming db.orders.create exists and returns an ID
        res.status(201).json({ message: 'Pedido creado exitosamente', orderId });

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
        const updated = db.orders.updateStatus(req.params.id, status);
        if (updated) {
            res.json({ message: 'Estado del pedido actualizado' });
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
    try {
        const orderId = req.params.id;
        const order = db.orders.getById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Only act on pending transfers
        if (order.paymentMethod !== 'transferencia' || order.status !== 'pending') {
            return res.status(400).json({ message: 'El pedido no es una transferencia pendiente.' });
        }

        const fifteenMinutes = 15 * 60 * 1000;
        const orderTime = new Date(order.createdAt).getTime();
        const currentTime = new Date().getTime();

        if ((currentTime - orderTime) > fifteenMinutes) {
            // Order has expired, proceed with cancellation
            db.products.restoreProductStock(order.items);
            db.orders.updateStatus(orderId, 'cancelled');
            const updatedOrder = db.orders.getById(orderId);
            console.log(`[Order Expiration] Order ${orderId} has been cancelled and stock restored.`);
            return res.json({ message: 'Pedido cancelado por expiración.', order: updatedOrder });
        }

        res.json({ message: 'El pedido aún no ha expirado.' });

    } catch (error) {
        console.error("Error checking order expiration:", error);
        res.status(500).json({ message: 'Error al verificar la expiración del pedido.' });
    }
};