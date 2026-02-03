import { Request, Response } from 'express';
import { db } from '../lib/database.js';
import { getAbandonedCartEmail } from '../lib/emailTemplates.js';
import { sendEmail } from '../emailService.js';
import { trackAddToCart, trackInitiateCheckout } from '../lib/metaConversionService.js';

export const captureAbandonedCart = async (req: Request, res: Response) => {
    const { email, cartItems } = req.body;

    if (!email || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ message: 'Email and cart items are required.' });
    }

    try {
        const cartId = db.carts.createOrUpdateAbandonedCart(email, cartItems);

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
        
        res.status(200).json({ message: 'Cart captured', cartId });
    } catch (error) {
        console.error('Error capturing abandoned cart:', error);
        res.status(500).json({ message: 'Error capturing cart' });
    }
};

export const processAbandonedCarts = async () => {
    console.log('[Scheduler] Running abandoned cart job...');
    try {
        const carts = db.carts.getPendingAbandonedCarts();
        console.log(`[Scheduler] Found ${carts.length} pending carts to process.`);

        for (const cart of carts) {
            const cartUrl = `${process.env.VITE_CLIENT_URL}/carrito`; // A generic cart URL
            const emailHtml = getAbandonedCartEmail(cart.email, cartUrl);
            
            await sendEmail(
                cart.email,
                '¿Olvidaste algo en tu bolsa?',
                emailHtml
            );

            db.carts.updateAbandonedCartStatus(cart.id, 'sent');
            console.log(`[Scheduler] Sent abandoned cart email to ${cart.email}`);
        }
    } catch (error) {
        console.error('[Scheduler] Error processing abandoned carts:', error);
    }
};
