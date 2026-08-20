import express from 'express';
import { checkServiceability, getShiprocketToken } from '../services/shiprocket.js';
import { supabase } from '../config/supabase.js';
import { sendOrderDispatchedEmail } from '../services/email.js';

const router = express.Router();

// Helper to resolve official courier tracking URLs
function getCourierTrackingUrl(courierName, awb) {
  if (!awb) return 'https://shiprocket.co/tracking';
  const cleanAwb = String(awb).trim();
  const courier = String(courierName || '').toLowerCase();

  if (courier.includes('delhivery')) return `https://www.delhivery.com/track/package/${cleanAwb}`;
  if (courier.includes('bluedart')) return `https://www.bluedart.com/tracking?waybill=${cleanAwb}`;
  if (courier.includes('xpressbees')) return `https://www.xpressbees.com/track?values=${cleanAwb}`;
  if (courier.includes('shadowfax')) return `https://tracker.shadowfax.in/track?orderId=${cleanAwb}`;
  return `https://shiprocket.co/tracking/${cleanAwb}`;
}

router.get('/test', async (req, res) => {
  try {
    const token = await getShiprocketToken();
    const result = await checkServiceability('110001', 0.5);
    return res.json({ success: true, tokenGenerated: !!token, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Pincode Lookup & Serviceability Check
router.post('/check-pincode', async (req, res) => {
  try {
    const { pincode, weight = 0.5 } = req.body;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit pincode.',
      });
    }

    const response = await checkServiceability(pincode, weight);

    if (response?.status === 200 && response?.data?.available_courier_companies?.length > 0) {
      const bestCourier = response.data.available_courier_companies[0];
      return res.json({
        success: true,
        serviceable: true,
        city: bestCourier.city || '',
        courierName: bestCourier.courier_name,
        estimatedDelivery: `${bestCourier.estimated_delivery_days || '3-5'} days`,
        rate: bestCourier.rate,
        codAvailable: bestCourier.cod === 1,
      });
    }

    return res.json({
      success: true,
      serviceable: false,
      message: 'Delivery is currently not available for this pincode.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// SHIPROCKET LIVE WEBHOOK (Auto-syncs Status, Delivered Date & Dispatched Email)
// =========================================================================
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('📦 Shiprocket Webhook Received:', JSON.stringify(payload));

    const orderId = payload.order_id || payload.channel_order_id;
    const awb = payload.awb || payload.awb_code || payload.awb_number;
    const courierName = payload.courier_name || payload.courier_company_id;
    const srStatus = String(payload.current_status || payload.status || '').toUpperCase();

    if (!orderId) {
      return res.status(200).json({ success: true, message: 'No order identifier found in payload.' });
    }

    // Match order by DY- ID or internal Shiprocket ID
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${orderId},shiprocket_order_id.eq.${orderId}`)
      .maybeSingle();

    if (!existingOrder) {
      console.warn(`Webhook Order not found in database: ${orderId}`);
      return res.status(200).json({ success: true, message: 'Order not matched in database.' });
    }

    const updates = {};
    if (awb && !existingOrder.awb_code) updates.awb_code = awb;
    if (courierName) updates.courier_name = courierName;

    // 1. Shipped / In-Transit State
    if (
      srStatus.includes('PICKED UP') ||
      srStatus.includes('IN TRANSIT') ||
      srStatus.includes('SHIPPED')
    ) {
      if (existingOrder.status !== 'SHIPPED') {
        updates.status = 'SHIPPED';

        // Trigger Dispatch Email via Resend
        const recipientEmail = existingOrder.shipping_address?.email || existingOrder.customer_email;
        if (recipientEmail && (awb || existingOrder.awb_code)) {
          const finalAwb = awb || existingOrder.awb_code;
          const finalCourier = courierName || existingOrder.courier_name || 'Shiprocket Express';

          sendOrderDispatchedEmail({
            orderId: existingOrder.id,
            customerEmail: recipientEmail,
            customerName: existingOrder.shipping_address?.fullName || existingOrder.customer_name || 'Valued Customer',
            courierName: finalCourier,
            awbCode: finalAwb,
            trackingUrl: getCourierTrackingUrl(finalCourier, finalAwb),
            estimatedDelivery: existingOrder.estimated_delivery || 'Within 2-4 Days',
          }).catch((mailErr) => console.warn('Webhook dispatch email background error:', mailErr));
        }
      }
    }

    // 2. Out For Delivery State
    else if (srStatus.includes('OUT FOR DELIVERY') || srStatus.includes('OUT_FOR_DELIVERY')) {
      updates.status = 'OUT_FOR_DELIVERY';
    }

    // 3. Delivered State (Activates 15-Day Return Window in Frontend)
    else if (srStatus.includes('DELIVERED')) {
      updates.status = 'DELIVERED';
      updates.delivered_date = new Date().toISOString();

      if (existingOrder.payment_method === 'Cash on Delivery') {
        updates.payment_status = 'PAID';
      }
    }

    // 4. Cancelled / RTO (Return to Origin) State
    else if (srStatus.includes('CANCEL') || srStatus.includes('RTO')) {
      updates.status = 'CANCELLED';
    }

    // Apply updates to Supabase
    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', existingOrder.id);

      if (updateErr) {
        console.error(`❌ Failed to update order ${existingOrder.id}:`, updateErr.message);
      } else {
        console.log(`✅ Order ${existingOrder.id} status synced to: ${updates.status || 'Details updated'}`);
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed successfully.' });
  } catch (err) {
    console.error('Shiprocket Webhook Exception:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
});

export default router;