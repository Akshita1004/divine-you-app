import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import {
  createShiprocketOrder,
  cancelShiprocketOrder,
  getShiprocketPickupOrigin,
} from '../services/shiprocket.js';
import {
  sendOrderConfirmationEmail,
  sendRefundProcessedEmail,
} from '../services/email.js';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper 1: Pre-Order Stock Validation
async function validateCartStock(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { valid: false, message: "Cart is empty." };
  }

  for (const item of cartItems) {
    try {
      const productId = item.id || item.product_id || null;
      const productName = (item.name || item.title || "Product").trim();
      const requestedQty = Number(item.quantity || item.qty || 1);

      let matchedProduct = null;

      if (productId) {
        const { data: byId } = await supabase
          .from('products')
          .select('*')
          .eq('id', String(productId))
          .maybeSingle();

        if (byId) matchedProduct = byId;
      }

      if (!matchedProduct && productId) {
        const { data: bySlug } = await supabase
          .from('products')
          .select('*')
          .eq('slug', String(productId))
          .maybeSingle();

        if (bySlug) matchedProduct = bySlug;
      }

      if (!matchedProduct && productName) {
        const { data: byName } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${productName}%`)
          .maybeSingle();

        if (byName) matchedProduct = byName;
      }

      if (matchedProduct) {
        const availableStock = Number(
          matchedProduct.stock_quantity ?? matchedProduct.stock ?? matchedProduct.quantity ?? 0
        );

        if (availableStock <= 0) {
          return {
            valid: false,
            message: `"${matchedProduct.name || productName}" is currently Out of Stock!`,
          };
        }

        if (requestedQty > availableStock) {
          return {
            valid: false,
            message: `Only ${availableStock} unit(s) available for "${matchedProduct.name || productName}". Please adjust quantity.`,
          };
        }
      }
    } catch (err) {
      console.warn("Stock validation warning:", err.message);
    }
  }

  return { valid: true };
}

// Helper 2: Stock Decrement (On Order Placement)
async function decrementProductStock(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    try {
      const productId = item.id || item.product_id || null;
      const productName = (item.name || item.title || "").trim();
      const orderQty = Number(item.quantity || item.qty || 1);

      let matchedProduct = null;

      if (productId) {
        const { data: byId } = await supabase.from('products').select('*').eq('id', String(productId)).maybeSingle();
        if (byId) matchedProduct = byId;
      }
      if (!matchedProduct && productId) {
        const { data: bySlug } = await supabase.from('products').select('*').eq('slug', String(productId)).maybeSingle();
        if (bySlug) matchedProduct = bySlug;
      }
      if (!matchedProduct && productName) {
        const { data: byName } = await supabase.from('products').select('*').ilike('name', `%${productName}%`).maybeSingle();
        if (byName) matchedProduct = byName;
      }

      if (!matchedProduct) continue;

      const currentStock = Number(matchedProduct.stock_quantity ?? matchedProduct.stock ?? matchedProduct.quantity ?? 0);
      const newStock = Math.max(0, currentStock - orderQty);

      const updatePayload = {};
      if ('stock_quantity' in matchedProduct) updatePayload.stock_quantity = newStock;
      if ('stock' in matchedProduct) updatePayload.stock = newStock;
      if ('quantity' in matchedProduct) updatePayload.quantity = newStock;

      await supabase.from('products').update(updatePayload).eq('id', matchedProduct.id);
      console.log(`📦 Stock updated: "${matchedProduct.name || matchedProduct.id}" (${currentStock} -> ${newStock})`);
    } catch (err) {
      console.warn('Stock decrement exception:', err.message);
    }
  }
}

// Helper 3: Stock Increment Rollback (On Cancellation / Return Approval)
async function incrementProductStock(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    try {
      const productId = item.id || item.product_id || null;
      const productName = (item.name || item.title || "").trim();
      const orderQty = Number(item.quantity || item.qty || 1);

      let matchedProduct = null;

      if (productId) {
        const { data: byId } = await supabase.from('products').select('*').eq('id', String(productId)).maybeSingle();
        if (byId) matchedProduct = byId;
      }
      if (!matchedProduct && productId) {
        const { data: bySlug } = await supabase.from('products').select('*').eq('slug', String(productId)).maybeSingle();
        if (bySlug) matchedProduct = bySlug;
      }
      if (!matchedProduct && productName) {
        const { data: byName } = await supabase.from('products').select('*').ilike('name', `%${productName}%`).maybeSingle();
        if (byName) matchedProduct = byName;
      }

      if (!matchedProduct) continue;

      const currentStock = Number(matchedProduct.stock_quantity ?? matchedProduct.stock ?? matchedProduct.quantity ?? 0);
      const newStock = currentStock + orderQty;

      const updatePayload = {};
      if ('stock_quantity' in matchedProduct) updatePayload.stock_quantity = newStock;
      if ('stock' in matchedProduct) updatePayload.stock = newStock;
      if ('quantity' in matchedProduct) updatePayload.quantity = newStock;

      await supabase.from('products').update(updatePayload).eq('id', matchedProduct.id);
      console.log(`🔄 Stock Rolled Back: "${matchedProduct.name || matchedProduct.id}" (${currentStock} -> ${newStock})`);
    } catch (err) {
      console.warn('Stock rollback exception:', err.message);
    }
  }
}

// Helper 4: Safe Address & Email Resolution
function resolveOrderAddressAndEmail(order) {
  let addressObj = {};
  if (typeof order.shipping_address === 'string') {
    try {
      addressObj = JSON.parse(order.shipping_address);
    } catch {
      addressObj = {};
    }
  } else if (order.shipping_address) {
    addressObj = order.shipping_address;
  }

  const email =
    addressObj.email ||
    order.customer_email ||
    order.user_email ||
    order.email ||
    null;

  const name =
    addressObj.fullName ||
    addressObj.full_name ||
    addressObj.name ||
    order.customer_name ||
    'Valued Customer';

  return { addressObj, email, name };
}

// 1. CREATE RAZORPAY ORDER
router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required.' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay Order Creation Error:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

// 2. VERIFY PAYMENT & PLACE ORDER
router.post('/verify-payment', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let extractedUserId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) extractedUserId = user.id;
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddress,
      cartItems,
      totalAmount,
      paymentMethod,
      userId,
      userEmail,
    } = req.body;

    const finalUserId = extractedUserId || userId || null;

    // Live Pre-Order Stock Validation
    const stockValidation = await validateCartStock(cartItems);
    if (!stockValidation.valid) {
      return res.status(400).json({ success: false, message: stockValidation.message });
    }

    if (paymentMethod !== 'Cash on Delivery') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Missing payment details.' });
      }

      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature!' });
      }
    }

    const orderId = `DY-${Math.floor(100000 + Math.random() * 900000)}`;
    const createdAt = new Date().toISOString();

    const deliveryDateObj = new Date();
    deliveryDateObj.setDate(deliveryDateObj.getDate() + 5);
    const estimatedDelivery = deliveryDateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const shippingCharge = Number(totalAmount > 999 ? 0 : 99);

    let originFacility = 'DIVINE YOU FULFILLMENT CENTER';
    try {
      originFacility = await getShiprocketPickupOrigin();
    } catch (originErr) {
      console.warn('Shiprocket origin fallback:', originErr.message);
    }

    let shiprocketDetails = null;
    try {
      const srResponse = await createShiprocketOrder({
        orderId,
        orderDate: createdAt,
        address: shippingAddress,
        items: cartItems,
        totalAmount,
        paymentMethod,
        userEmail,
      });

      if (srResponse?.order_id) {
        shiprocketDetails = {
          sr_order_id: srResponse.order_id,
          sr_shipment_id: srResponse.shipment_id,
        };
      }
    } catch (srErr) {
      console.error('Shiprocket Sync Warning:', srErr.message);
    }

    const orderData = {
      id: orderId,
      user_id: finalUserId,
      status: 'CONFIRMED',
      payment_id: razorpay_payment_id || 'COD_OFFLINE',
      razorpay_order_id: razorpay_order_id || null,
      payment_method: paymentMethod || 'UPI',
      payment_status: paymentMethod === 'Cash on Delivery' ? 'PENDING' : 'PAID',
      amount: Number(totalAmount),
      shipping_amount: shippingCharge,
      courier_info: 'Shiprocket Express',
      tracking_origin: originFacility,
      tracking_destination: shippingAddress?.city ? shippingAddress.city.toUpperCase() : 'DELIVERY LOCATION',
      estimated_delivery: estimatedDelivery,
      shipping_address: shippingAddress,
      items: cartItems,
      shiprocket_order_id: shiprocketDetails?.sr_order_id || null,
      shipment_id: shiprocketDetails?.sr_shipment_id || null,
      created_at: createdAt,
    };

    const { error: dbError } = await supabase.from('orders').insert([orderData]);
    if (dbError) console.error('Supabase DB Insert Error:', dbError.message);

    // Auto-decrement inventory
    decrementProductStock(cartItems).catch((e) => console.warn('Stock decrement error:', e));

    // Confirmation Email via Resend
    const recipientEmail = shippingAddress?.email || userEmail;
    if (recipientEmail) {
      sendOrderConfirmationEmail({
        orderId,
        customerEmail: recipientEmail,
        customerName: shippingAddress?.fullName || 'Customer',
        items: cartItems,
        totalAmount: Number(totalAmount),
        shippingAmount: shippingCharge,
        paymentMethod: paymentMethod || 'UPI',
        shippingAddress,
        estimatedDelivery,
      }).catch((mailErr) => console.warn('Email error:', mailErr));
    }

    res.status(200).json({
      success: true,
      message: 'Order placed successfully!',
      orderId: orderData.id,
      shiprocket: shiprocketDetails,
    });
  } catch (err) {
    console.error('Payment Verification Error:', err);
    res.status(500).json({ success: false, message: 'Server error during payment verification.' });
  }
});

// 3. CANCEL ORDER (WITH STOCK ROLLBACK + PREPAID AUTO REFUND + EMAIL)
router.post('/cancel-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Order ID is required.' });

    const { data: existingOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', String(orderId))
      .single();

    if (fetchErr || !existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const currentStatus = String(existingOrder.status || '').toUpperCase();
    const dispatchedStatuses = ['SHIPPED', 'IN TRANSIT', 'OUT_FOR_DELIVERY', 'OUT FOR DELIVERY', 'DELIVERED'];

    if (dispatchedStatuses.includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been dispatched. Cancellation is not permitted. You can request a return after delivery.',
      });
    }

    let newPaymentStatus = existingOrder.payment_status || 'PENDING';
    let refundDetails = null;

    const isPrepaid =
      existingOrder.payment_status === 'PAID' &&
      existingOrder.payment_id &&
      existingOrder.payment_id.startsWith('pay_');

    if (isPrepaid) {
      try {
        // Simplified Refund object for Razorpay Test Mode
        refundDetails = await razorpay.payments.refund(existingOrder.payment_id, {
          amount: Math.round(Number(existingOrder.amount) * 100),
        });
        newPaymentStatus = 'REFUNDED';
      } catch (refundErr) {
        console.error('❌ Razorpay Refund Error:', refundErr);
        return res.status(500).json({
          success: false,
          message: `Refund failed: ${refundErr.error?.description || 'Gateway error.'}`,
        });
      }
    }

    const srOrderId = existingOrder.shiprocket_order_id || existingOrder.shipping_address?.shiprocket_order_id;
    if (srOrderId) {
      try {
        await cancelShiprocketOrder(srOrderId);
      } catch (srErr) {
        console.warn('Shiprocket cancel warning:', srErr.message);
      }
    }

    const { error: dbError } = await supabase
      .from('orders')
      .update({
        status: 'CANCELLED',
        payment_status: newPaymentStatus,
      })
      .eq('id', String(orderId));

    if (dbError) return res.status(500).json({ success: false, message: dbError.message });

    // Stock Rollback on Cancellation
    let itemsList = existingOrder.items;
    if (typeof itemsList === 'string') {
      try { itemsList = JSON.parse(itemsList); } catch { itemsList = []; }
    }
    incrementProductStock(itemsList).catch((e) => console.warn('Stock rollback error:', e));

    // Send Refund Confirmation Email for Prepaid Cancellations
    if (newPaymentStatus === 'REFUNDED') {
      const { email: recipientEmail, name: customerName } = resolveOrderAddressAndEmail(existingOrder);
      if (recipientEmail) {
        sendRefundProcessedEmail({
          orderId: existingOrder.id,
          customerEmail: recipientEmail,
          customerName,
          refundAmount: existingOrder.amount,
          refundId: refundDetails?.id || 'INSTANT_CANCEL_REFUND',
          paymentMethod: existingOrder.payment_method,
          type: 'CANCEL',
        }).catch((e) => console.warn('Cancel refund email error:', e));
      }
    }

    res.status(200).json({
      success: true,
      message:
        newPaymentStatus === 'REFUNDED'
          ? 'Order cancelled & refund initiated directly to your bank account!'
          : 'Order cancelled successfully & inventory restored.',
      refundId: refundDetails?.id || null,
    });
  } catch (err) {
    console.error('Cancel Order API Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// 4. REQUEST RETURN (ACCEPTS COD UPI / BANK DETAILS)
router.post('/request-return', async (req, res) => {
  try {
    const { orderId, reason, comments, images, codRefundDetails } = req.body;

    if (!orderId || !reason) {
      return res.status(400).json({ success: false, message: 'Order ID and return reason are required.' });
    }

    const { data: existingOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', String(orderId))
      .single();

    if (fetchErr || !existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const deliveredDate = existingOrder.delivered_date
      ? new Date(existingOrder.delivered_date)
      : new Date(existingOrder.created_at);

    const daysSinceDelivery = Math.floor((new Date().getTime() - deliveredDate.getTime()) / (1000 * 3600 * 24));

    if (daysSinceDelivery > 15) {
      return res.status(400).json({
        success: false,
        message: 'Return window expired. Returns are only accepted within 15 days of delivery.',
      });
    }

    const returnPayload = {
      reason,
      comments: comments || '',
      images: images || [],
      requested_at: new Date().toISOString(),
      admin_status: 'PENDING_REVIEW',
      cod_payout_details: codRefundDetails || null,
    };

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'RETURN_REQUESTED',
        return_status: 'PENDING_REVIEW',
        return_details: returnPayload,
      })
      .eq('id', String(orderId));

    if (updateErr) return res.status(500).json({ success: false, message: updateErr.message });

    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully! Our team will review your photos within 24-48 hours.',
    });
  } catch (err) {
    console.error('Return Request Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// 5. CANCEL RETURN REQUEST (WITHIN 24 HOURS ONLY)
router.post('/cancel-return', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Order ID is required.' });

    const { data: existingOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', String(orderId))
      .single();

    if (fetchErr || !existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (existingOrder.status !== 'RETURN_REQUESTED') {
      return res.status(400).json({
        success: false,
        message: 'This order does not have an active return request to cancel.',
      });
    }

    const requestedAt = existingOrder.return_details?.requested_at
      ? new Date(existingOrder.return_details.requested_at)
      : new Date(existingOrder.created_at);

    const hoursSinceRequest = (new Date().getTime() - requestedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceRequest > 24) {
      return res.status(400).json({
        success: false,
        message: 'Return cancellation period expired. Returns can only be cancelled within 24 hours of submission.',
      });
    }

    const updatedReturnDetails = {
      ...(existingOrder.return_details || {}),
      cancelled_at: new Date().toISOString(),
      admin_status: 'CANCELLED_BY_USER',
    };

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'DELIVERED',
        return_status: 'CANCELLED',
        return_details: updatedReturnDetails,
      })
      .eq('id', String(orderId));

    if (updateErr) return res.status(500).json({ success: false, message: updateErr.message });

    res.status(200).json({
      success: true,
      message: 'Return request cancelled successfully. Your order remains marked as Delivered.',
    });
  } catch (err) {
    console.error('Cancel Return Exception:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// 6. ADMIN: APPROVE RETURN & PROCESS REFUND + EMAIL
router.post('/admin/approve-return-refund', async (req, res) => {
  try {
    const { orderId, adminNotes, codTransactionRef } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Order ID is required.' });

    const { data: existingOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', String(orderId))
      .single();

    if (fetchErr || !existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    let refundResult = null;
    const isPrepaid =
      existingOrder.payment_status === 'PAID' &&
      existingOrder.payment_id &&
      existingOrder.payment_id.startsWith('pay_');

    if (isPrepaid) {
      try {
        // Simplified Refund object for Razorpay Test Mode
        refundResult = await razorpay.payments.refund(existingOrder.payment_id, {
          amount: Math.round(Number(existingOrder.amount) * 100),
        });
      } catch (refundErr) {
        console.error('❌ Razorpay Return Refund Error:', refundErr);
        return res.status(500).json({
          success: false,
          message: `Refund failed: ${refundErr.error?.description || 'Gateway error.'}`,
        });
      }
    }

    const finalRefundRef = isPrepaid ? refundResult?.id : codTransactionRef || 'COD_REFUND_APPROVED';

    const updatedReturnDetails = {
      ...(existingOrder.return_details || {}),
      approved_at: new Date().toISOString(),
      admin_status: 'APPROVED',
      refund_id: finalRefundRef,
      admin_notes: adminNotes || 'Approved by admin.',
    };

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'RETURNED',
        return_status: 'APPROVED',
        payment_status: 'REFUNDED',
        return_details: updatedReturnDetails,
      })
      .eq('id', String(orderId));

    if (updateErr) return res.status(500).json({ success: false, message: updateErr.message });

    // Stock Rollback on Return Approval
    let itemsList = existingOrder.items;
    if (typeof itemsList === 'string') {
      try { itemsList = JSON.parse(itemsList); } catch { itemsList = []; }
    }
    incrementProductStock(itemsList).catch((e) => console.warn('Stock rollback error:', e));

    // Send Return Refund Processed Confirmation Email
    const { email: recipientEmail, name: customerName } = resolveOrderAddressAndEmail(existingOrder);
    if (recipientEmail) {
      sendRefundProcessedEmail({
        orderId: existingOrder.id,
        customerEmail: recipientEmail,
        customerName,
        refundAmount: existingOrder.amount,
        refundId: finalRefundRef,
        paymentMethod: existingOrder.payment_method,
        type: 'RETURN',
      }).catch((e) => console.warn('Return refund email error:', e));
    }

    res.status(200).json({
      success: true,
      message: isPrepaid
        ? 'Return approved! Full refund has been initiated to customer bank account via Razorpay.'
        : 'COD Return approved & marked as refunded successfully.',
      refundId: finalRefundRef,
    });
  } catch (err) {
    console.error('Approve Return Exception:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// 7. ADMIN: REJECT RETURN REQUEST
router.post('/admin/reject-return', async (req, res) => {
  try {
    const { orderId, rejectionReason } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Order ID is required.' });

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', String(orderId))
      .single();

    const updatedReturnDetails = {
      ...(existingOrder?.return_details || {}),
      rejected_at: new Date().toISOString(),
      admin_status: 'REJECTED',
      rejection_reason: rejectionReason || 'Product not eligible for return after inspection.',
    };

    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'DELIVERED',
        return_status: 'REJECTED',
        return_details: updatedReturnDetails,
      })
      .eq('id', String(orderId));

    if (updateErr) return res.status(500).json({ success: false, message: updateErr.message });

    res.status(200).json({
      success: true,
      message: 'Return request rejected. Order remains marked as Delivered.',
    });
  } catch (err) {
    console.error('Reject Return Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// 8. FETCH LOGGED-IN USER ORDERS
router.get('/my-orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = req.query.userId;

    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized session.' });

    const { data: orders, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dbError) return res.status(500).json({ success: false, message: dbError.message });
    res.json({ success: true, orders: orders || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// 9. SHIPROCKET WEBHOOK (To receive status updates)
router.post('/webhook/shiprocket', async (req, res) => {
  try {
    const { status, order_id, awb, courier_name } = req.body;

    if (!order_id) return res.status(400).json({ success: false, message: 'Missing order_id' });

    console.log(`🚚 Shiprocket Webhook Received: Order ${order_id} is now ${status}`);

    // Supabase mein order ka status update karein
    // Hum shiprocket_order_id se match karenge
    const { error: dbError } = await supabase
      .from('orders')
      .update({ 
        status: status.toUpperCase(),
        // optional: awb agar store karna ho
      })
      .eq('shiprocket_order_id', String(order_id));

    if (dbError) throw dbError;

    res.status(200).json({ success: true, message: 'Status updated' });
  } catch (err) {
    console.error('Shiprocket Webhook Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

export default router;