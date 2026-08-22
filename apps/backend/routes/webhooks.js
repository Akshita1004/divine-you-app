import express from 'express';
import { handleRazorpayWebhook, handleShiprocketWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/razorpay', handleRazorpayWebhook);

// Shiprocket ke liye POST aur GET dono allow kar dete hain taaki test ping fail na ho
router.post('/tracking-update', handleShiprocketWebhook);
router.get('/tracking-update', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Shiprocket webhook endpoint is active' });
});

export default router;