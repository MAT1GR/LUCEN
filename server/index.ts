// import 'dotenv/config'; // Deshabilitado para producción, las variables se manejan en cPanel

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import prisma from './lib/prisma.js'; // Import prisma client

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

// --- Graceful Shutdown for Prisma ---
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// --- CORS ---
app.use(cors({
  origin: ['https://denimrosario.com.ar', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// --- 1. ARCHIVOS ESTÁTICOS ---
app.use('/api/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

// --- 2. RUTAS API ---
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

// --- 3. CATCH-ALL ROUTE ---
app.get(/.*/, (req, res) => {
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