import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import crypto from 'crypto';
import { sendEmail, sendNewOrderAdminNotification } from '../emailService.js';
import { getShippedCadeteEmail, getShippedCorreoEmail, getOrderCancelledEmail, getOrderDeliveredAdminEmail, getOrderPaidEmail } from '../lib/emailTemplates.js';
import { Order as OrderType, CartItem } from '../types/index.js';

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { 
            customerId, customerName, customerEmail, customerPhone, customerDocNumber,
            items, shippingAddress, shippingInfo, shippingDetails, paymentMethod, total, status = 'pending'
        } = req.body;

        if (!customerId || !customerName || !customerEmail || !items || !total) {
            return res.status(400).json({ message: 'Faltan campos obligatorios para crear el pedido.' });
        }

        const orderId = crypto.randomUUID();
        
        const newOrderData = {
            id: orderId,
            customer_id: customerId,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            customer_doc_number: customerDocNumber,
            items: items, // Prisma handles JSON
            total: total,
            status: status,
            payment_method: paymentMethod,
            shipping_details: shippingDetails,
            shipping_street_name: shippingAddress?.streetName,
            shipping_street_number: shippingAddress?.streetNumber,
            shipping_apartment: shippingAddress?.apartment,
            shipping_description: shippingAddress?.description,
            shipping_city: shippingAddress?.city,
            shipping_postal_code: shippingAddress?.postalCode,
            shipping_province: shippingAddress?.province,
            shipping_cost: shippingInfo?.cost,
            shipping_name: shippingInfo?.name,
        };

        const createdOrder = await prisma.order.create({ data: newOrderData });

        if (createdOrder) {
            sendNewOrderAdminNotification(createdOrder, orderId).catch(console.error);
        }

        res.status(201).json({ message: 'Pedido creado exitosamente', orderId });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: 'Error al crear el pedido' });
    }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { status, searchTerm, page = 1, limit = 15 } = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);

        const where: any = {};
        if (status) where.status = status as string;
        if (searchTerm) {
            const search = searchTerm as string;
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { customer_name: { contains: search, mode: 'insensitive' } },
                { customer_email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const totalOrders = await prisma.order.count({ where });
        const orders = await prisma.order.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
        });

        res.json({
            orders,
            totalPages: Math.ceil(totalOrders / limitNum),
            currentPage: pageNum,
            totalOrders,
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: 'Error al obtener los pedidos' });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: status },
        });

        if (updatedOrder && updatedOrder.customer_email) {
            let subject = `Actualización de pedido #${orderId}`;
            let htmlBody = `<p>El estado de tu pedido es ahora: <strong>${status}</strong>.</p>`;

            const orderForEmail: any = updatedOrder;

            if (status === 'shipped') {
                const isRosarioCadete = orderForEmail.shipping_name === 'cadete' || (orderForEmail.shipping_details && orderForEmail.shipping_details.includes('/'));
                if (isRosarioCadete) {
                    subject = `¡Tu pedido llega el ${orderForEmail.shipping_details}! 🛵`;
                    htmlBody = getShippedCadeteEmail(orderForEmail.customer_name, orderId, orderForEmail.shipping_details || 'próximamente');
                } else {
                    subject = `¡Tu pedido está en camino! 🚚`;
                    htmlBody = getShippedCorreoEmail(orderForEmail.customer_name, orderId, orderForEmail.shipping_details || 'sin seguimiento');
                }
            } else if (status === 'cancelled') {
                subject = `Aviso sobre tu pedido #${orderId}`;
                htmlBody = getOrderCancelledEmail(orderForEmail.customer_name, orderId);
            } else if (status === 'paid') {
                subject = `¡Confirmado! Tu pedido #${orderId} ya es tuyo 🎉`;
                const itemsListHtml = `
                    <ul style="list-style: none; padding: 0;">
                        ${(orderForEmail.items as CartItem[]).map((item) => `
                            <li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                                <strong>${item.product.name}</strong> (Talle: ${item.size})
                                <br>
                                <span>${item.quantity} x $${item.product.price.toLocaleString('es-AR')}</span>
                            </li>
                        `).join('')}
                    </ul>
                `;
                htmlBody = getOrderPaidEmail(orderForEmail.customer_name, orderId, itemsListHtml);
            } else if (status === 'delivered') {
                subject = `¡Pedido Entregado! #${orderId} de ${orderForEmail.customer_name}`;
                const itemsListHtml = `
                    <ul style="list-style: none; padding: 0;">
                        ${(orderForEmail.items as CartItem[]).map((item) => `
                            <li style="margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                                <strong>${item.product.name}</strong> (Talle: ${item.size}) x ${item.quantity} - $${item.product.price.toLocaleString('es-AR')}
                            </li>
                        `).join('')}
                    </ul>
                `;
                htmlBody = getOrderDeliveredAdminEmail(
                    orderId,
                    orderForEmail.customer_name,
                    orderForEmail.customer_email,
                    orderForEmail.customer_phone || 'N/A',
                    `${orderForEmail.shipping_street_name} ${orderForEmail.shipping_street_number}, ${orderForEmail.shipping_city}, ${orderForEmail.shipping_province}`,
                    `${orderForEmail.shipping_name} - ${orderForEmail.shipping_details}`,
                    orderForEmail.payment_method,
                    orderForEmail.total,
                    itemsListHtml
                );
                sendEmail('grigomati@gmail.com', subject, htmlBody);
            }

            if (status !== 'delivered') {
                sendEmail(orderForEmail.customer_email, subject, htmlBody);
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
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (order) {
            if (order.payment_method === 'transferencia') {
                (order as any).bankDetails = {
                    bank: process.env.TRANSFER_BANK_NAME,
                    cvu: process.env.TRANSFER_CVU,
                    alias: process.env.TRANSFER_ALIAS,
                    titular: process.env.TRANSFER_HOLDER_NAME,
                    cuit: process.env.TRANSFER_HOLDER_CUIT,
                };
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
        const orders = await prisma.order.findMany({
            where: { customer_id: req.params.id },
            orderBy: { created_at: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(500).json({ message: 'Error al obtener los pedidos del cliente' });
    }
};

export const cancelIfExpired = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        if (order.payment_method !== 'transferencia' || order.status !== 'pending') {
            return res.status(400).json({ message: 'El pedido no es una transferencia pendiente.' });
        }

        const fifteenMinutes = 15 * 60 * 1000;
        const orderTime = new Date(order.created_at).getTime();
        const currentTime = new Date().getTime();

        if ((currentTime - orderTime) > fifteenMinutes) {
            const items = order.items as any[];
            const stockUpdates = items.map(item =>
                prisma.product.update({
                    where: { id: item.product.id },
                    data: { stock: { increment: item.quantity } }
                })
            );
            
            const cancelOrder = prisma.order.update({
                where: { id: orderId },
                data: { status: 'cancelled' }
            });

            const [updatedOrder] = await prisma.$transaction([cancelOrder, ...stockUpdates]);
            
            return res.json({ message: 'Pedido cancelado por expiración.', order: updatedOrder });
        }
        
        res.json({ message: 'El pedido aún no ha expirado.' });

    } catch (error) {
        console.error(`[cancelIfExpired] Error checking order expiration for ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al verificar la expiración del pedido.' });
    }
};

export const confirmPayment = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'awaiting_confirmation' }
        });
        res.json({ message: 'El estado del pedido se ha actualizado a "en espera de confirmación".' });
    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(404).json({ message: 'Error al confirmar el pago del pedido o pedido no encontrado' });
    }
};