import 'dotenv/config';

const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (token) {
  console.log("[MercadoPago] Access token loaded successfully. Starts with:", token.substring(0, 8));
} else {
  console.warn("[MercadoPago] WARNING: Access token not found.");
}

const apiBaseUrl = process.env.VITE_API_BASE_URL;
if (apiBaseUrl) {
    console.log("[Server] VITE_API_BASE_URL is set to:", apiBaseUrl);
} else {
    console.warn("[Server] WARNING: VITE_API_BASE_URL is not set.");
}

const clientUrl = process.env.VITE_CLIENT_URL;
if (clientUrl) {
    console.log("[Server] VITE_CLIENT_URL is set to:", clientUrl);
} else {
    console.warn("[Server] WARNING: VITE_CLIENT_URL is not set.");
}

import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase, saveDatabase, getDB } from './lib/db/connection.js';
import { initializeSchema } from './lib/db/init.js';

// --- Database Initialization ---
async function bootstrap() {
  try {
    await initializeDatabase();
    initializeSchema();
    console.log("[DB] Database initialized successfully.");
  } catch (err) {
    console.error("[DB] FATAL: Error initializing database:", err);
    process.exit(1);
  }
}

bootstrap();

// --- Graceful Shutdown ---
const gracefulSave = () => {
  try {
    console.log("[DB] Saving database before exit...");
    saveDatabase();
  } catch (e) {
    console.error("[DB] Error saving database during shutdown:", e);
  }
};

process.on("SIGINT", () => { gracefulSave(); process.exit(0); });
process.on("SIGTERM", () => { gracefulSave(); process.exit(0); });
process.on("uncaughtException", (err, origin) => {
  console.error(`Uncaught Exception: ${err.message} at ${origin}`);
  gracefulSave();
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulSave();
  process.exit(1);
});

const __dirname = path.resolve();

// --- Import rutas (.js obligatorio para dist) ---
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import shippingRoutes from './routes/shipping.js';
import notificationRoutes from './routes/notifications.js';
import paymentRoutes from './controllers/paymentController.js';

const app = express();

// --- CORS ---
app.use(cors({
  origin: ['https://denimrosario.com.ar', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// --- Archivos estáticos ---
app.use('/api/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// --- Prefijo /api para Vite ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// --- Debug Endpoint ---
app.get("/api/debug/db", (req, res) => {
  try {
    getDB();
    res.json({ ok: true, message: "Database is initialized." });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- Puerto ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
