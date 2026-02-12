// server/controllers/paymentController.ts
import { trackInitiateCheckout, trackPurchase } from '../lib/metaConversionService.js';
import { Request, Response, Router } from "express";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import prisma from '../lib/prisma.js';
import "dotenv/config";
import { CartItem } from "../../server/types/index.js";
import { sendEmail, sendNewOrderAdminNotification } from '../emailService.js';
import { getTransferInstructionEmail, getOrderConfirmationEmail } from '../lib/emailTemplates.js';
import crypto from 'crypto';

const router = Router();

// Helper to validate items against the database using Prisma
const validateItemsWithDB = async (items: any[]) => {
  const validatedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const dbProduct = await prisma.product.findUnique({ where: { id: parseInt(item.product.id) } });
    
    if (!dbProduct) {
      throw new Error(`Producto no encontrado: ${item.product.name}`);
    }

    // Assuming sizes/stock per size is not yet implemented in this controller's logic
    if (dbProduct.stock < item.quantity) {
      throw new Error(`Stock insuficiente para ${dbProduct.name}`);
    }

    validatedItems.push({
      ...item,
      product: { ...dbProduct, price: Number(dbProduct.price) },
      quantity: Number(item.quantity)
    });

    subtotal += Number(dbProduct.price) * Number(item.quantity);
  }
  
  const totalItems = validatedItems.reduce((total, item) => total + item.quantity, 0);
  let discount = 0;
  if (totalItems >= 3) {
    const allItems = validatedItems.flatMap(item => Array(item.quantity).fill(item.product));
    allItems.sort((a, b) => a.price - b.price);
    
    const numberOfDiscounts = Math.floor(totalItems / 3);
    for (let i = 0; i < numberOfDiscounts; i++) {
      discount += allItems[i].price;
    }
  }

  const total = subtotal - discount;

  return { validatedItems, subtotal, discount, total };
};

const createMercadoPagoPreference = async (req: Request, res: Response) => {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const apiBaseUrl = process.env.VITE_API_BASE_URL;

    if (!accessToken || !apiBaseUrl) {
      return res.status(500).json({ message: "Error de configuración del servidor." });
    }

    const { items, shippingCost, shippingInfo, shippingDetails, eventId } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Carrito vacío." });

    let validationResult;
    try {
        validationResult = await validateItemsWithDB(items);
    } catch (e: any) {
        return res.status(400).json({ message: e.message });
    }

    const { validatedItems, total } = validationResult;
    const safeShippingCost = Number(shippingCost) || 0;
    const finalTotal = total + safeShippingCost;

    const customer = await prisma.customer.upsert({
        where: { email: shippingInfo.email },
        update: { name: `${shippingInfo.firstName} ${shippingInfo.lastName}`, phone: shippingInfo.phone },
        create: {
            email: shippingInfo.email,
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            phone: shippingInfo.phone,
        }
    });

    const newOrderId = crypto.randomUUID();
    await prisma.order.create({
      data: {
        id: newOrderId,
        customer_id: customer.id,
        customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customer_email: shippingInfo.email,
        customer_phone: shippingInfo.phone,
        customer_doc_number: shippingInfo.docNumber || null,
        items: validatedItems,
        total: finalTotal,
        status: "pending",
        shipping_street_name: shippingInfo.streetName || null,
        shipping_street_number: shippingInfo.streetNumber || null,
        shipping_apartment: shippingInfo.apartment || null,
        shipping_description: shippingInfo.description || null,
        shipping_city: shippingInfo.city || null,
        shipping_postal_code: shippingInfo.postalCode || null,
        shipping_province: shippingInfo.province || null,
        shipping_cost: safeShippingCost,
        shipping_details: shippingDetails || null,
        payment_method: 'mercado-pago',
        created_at: new Date(),
      }
    });

    const newOrder = await prisma.order.findUnique({ where: { id: newOrderId } });
    if (newOrder) {
        sendNewOrderAdminNotification(newOrder, newOrderId).catch(console.error);
    }

    try {
        const userData = {
            email: shippingInfo.email,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            city: shippingInfo.city,
            zip: shippingInfo.postalCode,
            country: 'AR'
        };
        const eventSourceUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        trackInitiateCheckout(userData, validatedItems, eventSourceUrl);
    } catch (metaError) {
        console.error('Error sending Meta Conversion API InitiateCheckout event:', metaError);
    }

    const preferenceItems = validatedItems.map((item: any) => ({
      id: String(item.product.id),
      title: `${item.product.name} (Talle: ${item.size})`,
      quantity: Number(item.quantity),
      unit_price: Number(item.product.price),
      currency_id: "ARS",
    }));

    if (safeShippingCost > 0) {
      preferenceItems.push({
        id: "shipping",
        title: "Costo de Envío",
        quantity: 1,
        unit_price: safeShippingCost,
        currency_id: "ARS",
      });
    }

    const clientUrl = process.env.VITE_CLIENT_URL || "http://localhost:5173";
    const notificationUrl = `${apiBaseUrl}/api/payments/process-payment`;

    const preferenceBody = {
      items: preferenceItems,
      payer: {
        name: shippingInfo.firstName,
        surname: shippingInfo.lastName,
        email: shippingInfo.email,
      },
      back_urls: {
        success: `${clientUrl}/pago-exitoso?orderId=${newOrderId}`,
        failure: `${clientUrl}/carrito`,
        pending: `${clientUrl}/carrito`,
      },
      auto_return: "approved",
      external_reference: newOrderId,
      notification_url: notificationUrl,
      statement_descriptor: "DENIM ROSARIO"
    };

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceBody });
    
    res.json({ preferenceId: result.id, init_point: result.init_point });

  } catch (error: any) {
    console.error("❌ Error MP:", JSON.stringify(error, null, 2));
    res.status(500).json({ message: "Error al iniciar el pago.", error: error.message });
  }
};

const processPayment = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const paymentId = data?.id;

    if (paymentId) {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) return res.status(500).send();

      const mpClient = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(mpClient);
      const paymentResult = await payment.get({ id: paymentId });

      const orderId = paymentResult.external_reference;
      if (!orderId) return res.sendStatus(200);

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return res.sendStatus(404);

      if (paymentResult.status === "approved" && order.status !== 'paid') {
        const stockUpdates = (order.items as CartItem[]).map(item =>
          prisma.product.update({
            where: { id: parseInt(item.product.id) },
            data: { stock: { decrement: item.quantity } }
          })
        );

        const orderUpdate = prisma.order.update({
          where: { id: orderId },
          data: { status: "paid" }
        });
        
        const customerUpdate = prisma.customer.update({
            where: { id: order.customer_id },
            data: { total_spent: { increment: paymentResult.transaction_amount || order.total } }
        });

        await prisma.$transaction([...stockUpdates, orderUpdate, customerUpdate]);
        
        console.log(`✅ Orden ${orderId} PAGADA.`);

        // Preserve email and Meta Pixel logic
        // ...
      } else if (paymentResult.status && paymentResult.status !== 'approved') {
          await prisma.order.update({ where: { id: orderId }, data: { status: paymentResult.status } });
      }
    }
    res.sendStatus(200);
  } catch (error: any) {
    console.error("Error webhook:", error.message);
    res.status(500).json({ message: "Error interno webhook" });
  }
};

const createTransferOrder = async (req: Request, res: Response) => {
  const { items, shippingInfo, shipping, shippingDetails, eventId } = req.body;

  try {
    if (!items || items.length === 0) return res.status(400).json({ message: "Carrito vacío." });

    let validationResult;
    try {
        validationResult = await validateItemsWithDB(items);
    } catch (e: any) {
        return res.status(400).json({ message: e.message });
    }

    const { validatedItems, total } = validationResult;
    const shippingCost = Number(shipping?.cost) || 0;
    const finalTotal = (total + shippingCost) * 0.9;

    const customer = await prisma.customer.upsert({
        where: { email: shippingInfo.email },
        update: { name: `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim(), phone: shippingInfo.phone },
        create: {
            email: shippingInfo.email,
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim(),
            phone: shippingInfo.phone,
        }
    });
    
    const stockUpdates = validatedItems.map(item =>
        prisma.product.update({
            where: { id: parseInt(item.product.id) },
            data: { stock: { decrement: item.quantity } }
        })
    );

    const newOrderId = crypto.randomUUID();
    const createOrderPromise = prisma.order.create({
      data: {
        id: newOrderId,
        customer_id: customer.id,
        customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customer_email: shippingInfo.email,
        customer_phone: shippingInfo.phone,
        // ... other fields
        items: validatedItems,
        total: finalTotal,
        status: "pending",
        payment_method: 'transferencia',
      }
    });

    const [, createdOrder] = await prisma.$transaction([...stockUpdates, createOrderPromise]);

    // Preserve email and Meta Pixel logic
    // ...
    
    const orderWithDetails = await prisma.order.findUnique({ where: { id: newOrderId } });
    if (orderWithDetails) {
        (orderWithDetails as any).bankDetails = { /* ... */ };
    }

    res.status(201).json({ id: newOrderId, order: orderWithDetails });

  } catch (error: any) {
    console.error("Error orden transferencia:", error);
    res.status(500).json({ message: "Error creando orden." });
  }
};

router.post("/create-preference", createMercadoPagoPreference);
router.post("/process-payment", processPayment);
router.post("/create-transfer-order", createTransferOrder);

export default router;