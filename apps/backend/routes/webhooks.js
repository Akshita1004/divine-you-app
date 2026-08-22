import express from 'express';
import { handleRazorpayWebhook, handleShiprocketWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/razorpay', handleRazorpayWebhook);
router.post('/tracking-update', handleShiprocketWebhook); // Yahan badal diya

export default router;