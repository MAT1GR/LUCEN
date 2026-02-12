import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { getAbandonedCartEmail } from '../lib/emailTemplates.js';
import { sendEmail } from '../emailService.js';
import { trackAddToCart, trackInitiateCheckout } from '../lib/metaConversionService.js';

export const captureAbandonedCart = async (req: Request, res: Response) => {
    const { email, cartItems } = req.body;

    if (!email || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ message: 'Email and cart items are required.' });
    }

    try {
        const cart = await prisma.abandonedCart.upsert({
            where: { email: email },
            update: {
                cart_items: cartItems,
                status: 'pending', // Reset status if user comes back
            },
            create: {
                email: email,
                cart_items: cartItems,
            },
        });

        const userData = {
            email: email,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        };
        const eventSourceUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

        trackInitiateCheckout(userData, cartItems, eventSourceUrl);

        for (const item of cartItems) {
            trackAddToCart(userData, item.product, item.quantity, eventSourceUrl);
        }
        
        res.status(200).json({ message: 'Cart captured', cartId: cart.id });
    } catch (error) {
        console.error('Error capturing abandoned cart:', error);
        res.status(500).json({ message: 'Error capturing cart' });
    }
};

export const processAbandonedCarts = async () => {
    console.log('[Scheduler] Running abandoned cart job...');
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        const carts = await prisma.abandonedCart.findMany({
            where: {
                status: 'pending',
                updated_at: {
                    lt: oneHourAgo,
                    gt: twoHoursAgo,
                }
            }
        });

        console.log(`[Scheduler] Found ${carts.length} pending carts to process.`);
        if (carts.length === 0) return;

        const sentCartIds: number[] = [];
        for (const cart of carts) {
            const cartUrl = `${process.env.VITE_CLIENT_URL}/carrito`; 
            const emailHtml = getAbandonedCartEmail(cart.email, cartUrl);
            
            await sendEmail(
                cart.email,
                '¿Olvidaste algo en tu bolsa?',
                emailHtml
            );
            sentCartIds.push(cart.id);
            console.log(`[Scheduler] Sent abandoned cart email to ${cart.email}`);
        }

        // Update all sent carts in one go
        await prisma.abandonedCart.updateMany({
            where: {
                id: { in: sentCartIds }
            },
            data: {
                status: 'sent'
            }
        });

    } catch (error) {
        console.error('[Scheduler] Error processing abandoned carts:', error);
    }
};
