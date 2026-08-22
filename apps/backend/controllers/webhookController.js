import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

// 1. Razorpay Webhook Handler
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`🔔 Razorpay Webhook Received: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Supabase database update for Razorpay payment success
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'Paid', 
          payment_id: razorpayPaymentId,
          status: 'Confirmed'
        })
        .eq('razorpay_order_id', razorpayOrderId);

      if (error) {
        console.error('❌ Supabase Update Error (Razorpay):', error.message);
      } else {
        console.log(`✅ Payment captured & database updated for Razorpay Order ID: ${razorpayOrderId}`);
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Razorpay Webhook Error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// 2. Shiprocket Webhook Handler
export const handleShiprocketWebhook = async (req, res) => {
  try {
    // Optional Token Verification (Shiprocket x-api-key check)
    const incomingToken = req.headers['x-api-key'] || req.headers['authorization'];
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;

    if (expectedToken && incomingToken && incomingToken !== expectedToken) {
      console.warn('⚠️ Unauthorized Shiprocket Webhook attempt detected.');
      return res.status(401).json({ error: 'Unauthorized: Invalid Token' });
    }

    const { order_id, shipment_id, current_status, AWB, courier_name } = req.body || {};

    // Agar Shiprocket test request bhej raha hai aur order_id nahi hai, toh bhi 200 OK de dein
    if (!order_id) {
      console.log('📦 Shiprocket Test Webhook Received Successfully!');
      return res.status(200).json({ status: 'ok', message: 'Test webhook verified' });
    }

    console.log(`📦 Shiprocket Webhook Received for Order ID: ${order_id}, Status: ${current_status}`);

    // Supabase database update for Shiprocket shipping status
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: current_status,
        shipment_id: shipment_id ? String(shipment_id) : undefined,
        awb_code: AWB,
        courier_name: courier_name
      })
      .eq('shiprocket_order_id', order_id);

    if (error) {
      console.error('❌ Supabase Update Error (Shiprocket):', error.message);
    } else {
      console.log(`✅ Shipping status updated successfully for Shiprocket Order ID: ${order_id}`);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Shiprocket Webhook Error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};