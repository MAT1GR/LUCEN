import 'dotenv/config';

// ... (tus logs de debug de MercadoPago y variables de entorno están bien, déjalos igual) ...
// (Para ahorrar espacio, asumo que las primeras líneas de imports y logs se mantienen igual hasta llegar a "const app = express();")

import express from 'express';
import cors from 'cors';
import path from 'node:path'; // Nota: node:path está bien para versiones modernas
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
// ... (resto de handlers de error)

const __dirname = path.resolve();

// --- Import rutas ---
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import shippingRoutes from './routes/shipping.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import paymentRoutes from './controllers/paymentController.js';
import cartRoutes from './routes/cart.js';
import reviewsRoutes from './routes/reviews.js';
import { processAbandonedCarts } from './controllers/cartController.js';

const app = express();

// --- CORS ---
app.use(cors({
  origin: ['https://denimrosario.com.ar', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// --- 1. ARCHIVOS ESTÁTICOS (Corrección Importante) ---
// Sirve las imágenes subidas
app.use('/api/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Sirve el frontend compilado (React/Vite)
// Asegúrate de que Vite construye en la carpeta 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// --- 2. RUTAS API (Corrección Importante: Restaura el prefijo /api) ---
// Si quitas el /api, tu frontend dejará de funcionar porque no encontrará los datos.
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/reviews', reviewsRoutes);

// --- Debug Endpoint ---
app.get("/api/debug/db", (req, res) => {
  try {
    getDB();
    res.json({ ok: true, message: "Database is initialized." });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- 3. CATCH-ALL ROUTE (Corrección Importante) ---
// Esto hace que si entras a denimrosario.com.ar/tienda, Express no de error 404,
// sino que entregue la app de React para que ella maneje la ruta.
app.get('*', (req, res) => {
  // Ignoramos las rutas que empiezan por /api para que den 404 real si no existen
  if (req.path.startsWith('/api')) {
     return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Puerto ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // --- Abandoned Cart Scheduler ---
    const oneHour = 60 * 60 * 1000;
    setInterval(processAbandonedCarts, oneHour);
    console.log('[Scheduler] Abandoned cart job started. Will run every hour.');
});