// server/controllers/paymentController.ts
import { Request, Response, Router } from "express";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { db } from '../lib/database.js';
import "dotenv/config";
import { CartItem } from "../../server/types/index.js";

const router = Router();

// Helper para validar stock y precios (Reutilizable)
const validateItemsWithDB = (items: any[]) => {
  const validatedItems = [];
  let subtotal = 0;

  for (const item of items) {
    // 1. Buscamos el producto REAL en la base de datos
    const dbProduct = db.products.getById(item.product.id);
    
    if (!dbProduct) {
      throw new Error(`Producto no encontrado: ${item.product.name}`);
    }

    // 2. Verificamos stock
    // Accedemos a sizes de forma segura
    const sizes = typeof dbProduct.sizes === 'string' 
      ? JSON.parse(dbProduct.sizes) 
      : dbProduct.sizes;

    // Si no existe el talle o no hay stock, lanzamos error
    if (!sizes[item.size] || sizes[item.size].stock < item.quantity) {
      throw new Error(`Stock insuficiente para ${dbProduct.name} (Talle: ${item.size})`);
    }

    // 3. REEMPLAZAMOS EL PRECIO: Usamos dbProduct.price, ignoramos item.product.price
    validatedItems.push({
      ...item,
      product: {
        ...dbProduct, // Usamos toda la info real de la DB
        price: Number(dbProduct.price) // Aseguramos que sea el precio real
      },
      quantity: Number(item.quantity)
    });

    subtotal += Number(dbProduct.price) * Number(item.quantity);
  }

  return { validatedItems, subtotal };
};

const createMercadoPagoPreference = async (req: Request, res: Response) => {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const apiBaseUrl = process.env.VITE_API_BASE_URL;

    if (!accessToken || !apiBaseUrl) {
      return res.status(500).json({ message: "Error de configuración del servidor." });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const { items, shippingCost, shippingInfo, shipping, shippingDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Carrito vacío." });
    }

    // --- PASO CRÍTICO DE SEGURIDAD ---
    // Recalculamos todo con datos de la DB. Si el usuario modificó el precio en el front, aquí se ignora.
    let validationResult;
    try {
        validationResult = validateItemsWithDB(items);
    } catch (e: any) {
        return res.status(400).json({ message: e.message });
    }

    const { validatedItems, subtotal } = validationResult;
    const safeShippingCost = Number(shippingCost) || 0;
    const total = subtotal + safeShippingCost;

    // Creamos o buscamos cliente
    const customerId = db.customers.findOrCreate({
      email: shippingInfo.email,
      name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
      phone: shippingInfo.phone,
    });

    // Creamos la orden con los items VALIDADOS
    const newOrderId = db.orders.create({
      customerId: customerId.toString(),
      customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
      customerEmail: shippingInfo.email,
      customerPhone: shippingInfo.phone,
      customerDocNumber: shippingInfo.docNumber || null,
      items: validatedItems, // Guardamos los items con el precio real
      total: total,
      status: "pending",
      shippingStreetName: shippingInfo.streetName || null,
      shippingStreetNumber: shippingInfo.streetNumber || null,
      shippingApartment: shippingInfo.apartment || null,
      shippingDescription: shippingInfo.description || null,
      shippingCity: shippingInfo.city || null,
      shippingPostalCode: shippingInfo.postalCode || null,
      shippingProvince: shippingInfo.province || null,
      shippingCost: safeShippingCost,
      shippingDetails: shippingDetails || null,
      paymentMethod: 'mercado-pago',
      createdAt: new Date(),
    });

    // Preparamos items para MP usando los datos VALIDADOS
    const preferenceItems = validatedItems.map((item: any) => ({
      id: String(item.product.id),
      title: `${item.product.name} (Talle: ${item.size})`,
      quantity: Number(item.quantity),
      unit_price: Number(item.product.price), // Precio real de DB
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
      external_reference: String(newOrderId),
      notification_url: notificationUrl,
      statement_descriptor: "DENIM ROSARIO"
    };

    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceBody });
    
    res.json({ preferenceId: result.id, init_point: result.init_point });

  } catch (error: any) {
    console.error("❌ Error MP:", JSON.stringify(error, null, 2));
    res.status(500).json({
      message: "Error al iniciar el pago.",
      error: error.message
    });
  }
};

const processPayment = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    const paymentId = data?.id || (type === 'payment' ? req.body.data?.id : null);

    if (paymentId) {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) return res.status(500).send();

      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);
      const paymentResult = await payment.get({ id: paymentId });

      const orderId = paymentResult.external_reference;
      if (!orderId) return res.sendStatus(200);

      const order = db.orders.getById(orderId);
      if (!order) return res.sendStatus(404);

      if (paymentResult.status === "approved" && order.status !== 'paid') {
        db.orders.updateStatus(orderId, "paid");
        // Usamos items de la orden (que ya fueron validados al crearse)
        db.products.updateProductStock(order.items); 
        db.customers.updateTotalSpent(order.customerId, paymentResult.transaction_amount || order.total);
        console.log(`✅ Orden ${orderId} PAGADA.`);
      } else if (paymentResult.status && paymentResult.status !== 'approved') {
          db.orders.updateStatus(orderId, paymentResult.status);
      }
    }
    res.sendStatus(200);
  } catch (error: any) {
    console.error("Error webhook:", error.message);
    res.status(500).json({ message: "Error interno webhook" });
  }
};

const createTransferOrder = async (req: Request, res: Response) => {
  const { items, shippingInfo, shipping, shippingDetails } = req.body;

  try {
    if (!items || items.length === 0) return res.status(400).json({ message: "Carrito vacío." });

    // --- VALIDACIÓN DE SEGURIDAD TAMBIÉN AQUÍ ---
    let validationResult;
    try {
        validationResult = validateItemsWithDB(items);
    } catch (e: any) {
        return res.status(400).json({ message: e.message });
    }

    const { validatedItems, subtotal } = validationResult;
    const shippingCost = Number(shipping?.cost) || 0;
    
    // Aplicamos el descuento sobre el subtotal REAL validado
    const finalTotal = (subtotal + shippingCost) * 0.9; 

    const customerId = db.customers.findOrCreate({
      email: shippingInfo.email,
      name: `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim(),
      phone: shippingInfo.phone,
    });
    
    // Descontamos stock de los items reales
    db.products.updateProductStock(validatedItems);

    const newOrderId = db.orders.create({
      customerId: customerId.toString(),
      customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
      customerEmail: shippingInfo.email,
      customerPhone: shippingInfo.phone,
      customerDocNumber: shippingInfo.docNumber || null,
      items: validatedItems,
      total: finalTotal,
      status: "pending" as const,
      shippingStreetName: shippingInfo.streetName || null,
      shippingStreetNumber: shippingInfo.streetNumber || null,
      shippingApartment: shippingInfo.apartment || null,
      shippingDescription: shippingInfo.description || null,
      shippingCity: shippingInfo.city || null,
      shippingPostalCode: shippingInfo.postalCode || null,
      shippingProvince: shippingInfo.province || null,
      shippingCost: shippingCost,
      shippingName: shipping.name || 'No especificado',
      shippingDetails: shippingDetails || null,
      paymentMethod: 'transferencia',
      createdAt: new Date(),
    });

    res.status(201).json({ id: newOrderId.toString(), order: db.orders.getById(newOrderId.toString()) });

  } catch (error: any) {
    console.error("Error orden transferencia:", error);
    res.status(500).json({ message: "Error creando orden." });
  }
};

router.post("/create-preference", createMercadoPagoPreference);
router.post("/process-payment", processPayment);
router.post("/create-transfer-order", createTransferOrder);

export default router;