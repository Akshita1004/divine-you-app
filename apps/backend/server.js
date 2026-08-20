import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route Imports
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import contactRoutes from './routes/contact.js';
import shippingRoutes from './routes/shipping.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

// Middlewares (Increased payload limits for Base64 image uploads)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/shipping', shippingRoutes);

// Root Healthcheck
app.get('/', (req, res) => {
  res.json({ message: 'Divine You API Backend running smoothly with Supabase & Shiprocket' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Express Backend running on http://localhost:${PORT}`);
});