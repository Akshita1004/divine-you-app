import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || "orders@contact.divineyou.net";

// ==========================================
// 1. ORDER CONFIRMATION EMAIL
// ==========================================
export async function sendOrderConfirmationEmail({
  orderId,
  customerEmail,
  customerName,
  items,
  totalAmount,
  shippingAmount,
  paymentMethod,
  shippingAddress,
  estimatedDelivery,
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY missing in .env");
    return { success: false, message: "Missing API Key" };
  }

  if (!customerEmail || !customerEmail.includes('@')) {
    console.warn("⚠️ Customer email missing or invalid:", customerEmail);
    return { success: false, message: "Invalid email" };
  }

  const subtotal = Math.max(0, Number(totalAmount || 0) - Number(shippingAmount || 0));

  const itemsHtml = (items || [])
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #E2DAD0;">
        <td style="padding: 12px 0;">
          <div style="font-weight: 600; font-size: 14px; color: #1C1A19;">
            ${item.name || item.title || "Ayurvedic Product"}
          </div>
          <div style="font-size: 12px; color: #7D7871; margin-top: 2px;">
            Qty: ${item.quantity || item.qty || 1} · ${item.size || "Standard"}
          </div>
        </td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600; font-size: 14px; color: #1C1A19;">
          ₹${(Number(item.price || 0) * Number(item.quantity || item.qty || 1)).toLocaleString("en-IN")}
        </td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8F5EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2C2A29;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFBF7; border-radius: 20px; border: 1px solid #EBE5DA; overflow: hidden;">
                <tr>
                  <td style="background-color: #1D3B28; padding: 28px; text-align: center;">
                    <h1 style="color: #FDFBF7; font-family: Georgia, serif; font-size: 26px; margin: 0; letter-spacing: 1px;">
                      DIVINE YOU
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px 30px 10px 30px;">
                    <span style="display: inline-block; background-color: #E2EBE0; color: #1D3B28; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px;">
                      ORDER CONFIRMED
                    </span>
                    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #1C1A19; margin: 12px 0 6px 0;">
                      Thank you for your order, ${customerName || "Valued Customer"}!
                    </h2>
                    <p style="font-size: 13px; color: #524E4A; line-height: 1.5; margin: 0;">
                      Your order has been placed successfully and is being prepared for dispatch.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 30px;">
                    <table width="100%" style="background-color: #F5EFE6; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #524E4A;">
                      <tr>
                        <td><strong>Order ID:</strong> ${orderId}</td>
                        <td align="right"><strong>Est. Delivery:</strong> ${estimatedDelivery || "3-5 Days"}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 30px;">
                    <h3 style="font-family: Georgia, serif; font-size: 15px; color: #1C1A19; margin: 10px 0; border-bottom: 1px solid #E2DAD0; padding-bottom: 6px;">
                      Items Ordered
                    </h3>
                    <table width="100%" cellspacing="0" cellpadding="0">
                      ${itemsHtml}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 30px;">
                    <table width="100%" style="font-size: 13px; color: #524E4A;">
                      <tr>
                        <td>Subtotal</td>
                        <td align="right">₹${subtotal.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td style="padding-top: 4px;">Shipping</td>
                        <td align="right" style="padding-top: 4px; color: #1D3B28; font-weight: 600;">
                          ${Number(shippingAmount) === 0 ? "FREE" : `₹${shippingAmount}`}
                        </td>
                      </tr>
                      <tr style="border-top: 1px solid #E2DAD0;">
                        <td style="padding-top: 10px; font-weight: bold; color: #1C1A19;">Total Amount</td>
                        <td align="right" style="padding-top: 10px; font-weight: bold; font-size: 16px; color: #1D3B28;">
                          ₹${Number(totalAmount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 30px 25px 30px;">
                    <div style="background-color: #FAF8F2; border: 1px solid #EAE3D6; border-radius: 10px; padding: 12px; font-size: 12px; color: #524E4A; line-height: 1.4;">
                      <strong style="color: #1C1A19; display: block; margin-bottom: 4px;">Delivery Address:</strong>
                      ${shippingAddress?.fullName || customerName || ""}<br>
                      ${shippingAddress?.addressLine1 || ""}, ${shippingAddress?.city || ""} ${shippingAddress?.pincode || ""}<br>
                      Payment: <strong>${paymentMethod || "UPI"}</strong>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F4EFE6; padding: 18px; text-align: center; font-size: 11px; color: #7D7871; border-top: 1px solid #E2DAD0;">
                    © ${new Date().getFullYear()} Divine You Ayurveda · support@contact.divineyou.net
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `Divine You <${SENDER_EMAIL}>`,
      to: [customerEmail],
      subject: `Order Confirmed: ${orderId} - Divine You`,
      html: htmlContent,
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return { success: false, error };
    }

    console.log("✅ Resend Order Confirmation Email Sent. ID:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Resend Email Trigger Exception:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 2. ORDER DISPATCHED EMAIL (WITH LIVE TRACKING)
// ==========================================
export async function sendOrderDispatchedEmail({
  orderId,
  customerEmail,
  customerName,
  courierName,
  awbCode,
  trackingUrl,
  estimatedDelivery,
}) {
  if (!process.env.RESEND_API_KEY || !customerEmail || !customerEmail.includes('@')) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Dispatched</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8F5EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2C2A29;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFBF7; border-radius: 20px; border: 1px solid #EBE5DA; overflow: hidden;">
                <tr>
                  <td style="background-color: #1D3B28; padding: 28px; text-align: center;">
                    <h1 style="color: #FDFBF7; font-family: Georgia, serif; font-size: 26px; margin: 0; letter-spacing: 1px;">
                      DIVINE YOU
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px 30px 10px 30px;">
                    <span style="display: inline-block; background-color: #E2EBE0; color: #1D3B28; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px;">
                      ORDER DISPATCHED · ON THE WAY
                    </span>
                    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #1C1A19; margin: 12px 0 6px 0;">
                      Your package is on its way, ${customerName || "Valued Customer"}!
                    </h2>
                    <p style="font-size: 13px; color: #524E4A; line-height: 1.5; margin: 0;">
                      Order <strong>${orderId}</strong> has been handed over to our delivery partner and is moving towards your city.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 30px;">
                    <div style="background-color: #F5EFE6; border: 1px solid #E2DAD0; border-radius: 12px; padding: 18px; font-size: 13px; color: #1C1A19;">
                      <table width="100%" cellspacing="0" cellpadding="0" style="line-height: 1.8;">
                        <tr>
                          <td style="color: #7D7871; width: 45%;">Courier Partner:</td>
                          <td><strong>${courierName || "Shiprocket Express"}</strong></td>
                        </tr>
                        <tr>
                          <td style="color: #7D7871;">AWB / Tracking No:</td>
                          <td><strong style="font-family: monospace; font-size: 14px; color: #1D3B28;">${awbCode || "N/A"}</strong></td>
                        </tr>
                        <tr>
                          <td style="color: #7D7871;">Expected Delivery:</td>
                          <td><strong>${estimatedDelivery || "Within 2-4 Days"}</strong></td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px 30px 25px 30px;">
                    <a href="${trackingUrl || '#'}" style="background-color: #1D3B28; color: #FDFBF7; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 10px; display: inline-block;">
                      Track Package Live GPS
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F4EFE6; padding: 18px; text-align: center; font-size: 11px; color: #7D7871; border-top: 1px solid #E2DAD0;">
                    © ${new Date().getFullYear()} Divine You Ayurveda · support@contact.divineyou.net
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const { data } = await resend.emails.send({
      from: `Divine You <${SENDER_EMAIL}>`,
      to: [customerEmail],
      subject: `Order Shipped: ${orderId} · Tracking No: ${awbCode} - Divine You`,
      html: htmlContent,
    });
    console.log("✅ Resend Order Dispatched Email Sent. ID:", data?.id);
  } catch (err) {
    console.warn("❌ Dispatch email error:", err.message);
  }
}

// ==========================================
// 3. REFUND PROCESSED EMAIL (CANCELLATION & RETURN)
// ==========================================
export async function sendRefundProcessedEmail({
  orderId,
  customerEmail,
  customerName,
  refundAmount,
  refundId,
  paymentMethod,
  type = "RETURN", // "RETURN" or "CANCEL"
}) {
  if (!process.env.RESEND_API_KEY || !customerEmail || !customerEmail.includes('@')) return;

  const isReturn = type === "RETURN";
  const badgeText = isReturn ? "RETURN REFUND PROCESSED" : "ORDER CANCELLED · REFUND INITIATED";
  const titleText = isReturn ? "Return Approved & Refund Processed" : "Order Cancelled & Refund Initiated";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Refund Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8F5EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2C2A29;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFBF7; border-radius: 20px; border: 1px solid #EBE5DA; overflow: hidden;">
                <tr>
                  <td style="background-color: #1D3B28; padding: 28px; text-align: center;">
                    <h1 style="color: #FDFBF7; font-family: Georgia, serif; font-size: 26px; margin: 0; letter-spacing: 1px;">
                      DIVINE YOU
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px 30px 10px 30px;">
                    <span style="display: inline-block; background-color: #E2EBE0; color: #1D3B28; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px;">
                      ${badgeText}
                    </span>
                    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #1C1A19; margin: 12px 0 6px 0;">
                      ${titleText}
                    </h2>
                    <p style="font-size: 13px; color: #524E4A; line-height: 1.5; margin: 0;">
                      Hello <strong>${customerName || "Customer"}</strong>, your refund for Order <strong>${orderId}</strong> has been successfully processed.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 30px 25px 30px;">
                    <div style="background-color: #F5EFE6; border: 1px solid #E2DAD0; border-radius: 12px; padding: 18px; font-size: 13px;">
                      <table width="100%" cellspacing="0" cellpadding="0" style="line-height: 2;">
                        <tr>
                          <td style="color: #7D7871;">Refund Amount:</td>
                          <td align="right" style="font-size: 16px; font-weight: bold; color: #1D3B28;">
                            ₹${Number(refundAmount || 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                        <tr>
                          <td style="color: #7D7871;">Reference / UTR ID:</td>
                          <td align="right" style="font-family: monospace; font-size: 13px; font-weight: 600; color: #1C1A19;">
                            ${refundId || "INSTANT_REFUND"}
                          </td>
                        </tr>
                        <tr>
                          <td style="color: #7D7871;">Payout Destination:</td>
                          <td align="right" style="color: #1C1A19; font-weight: 500;">
                            ${paymentMethod === "Cash on Delivery" ? "Bank / UPI Destination" : "Original Payment Source (Bank/UPI/Card)"}
                          </td>
                        </tr>
                      </table>
                    </div>
                    <p style="font-size: 11px; color: #7D7871; margin-top: 14px; margin-bottom: 0; line-height: 1.4;">
                      Prepaid bank refunds generally reflect in your account within <strong>3-5 business days</strong> depending on your issuing bank.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F4EFE6; padding: 18px; text-align: center; font-size: 11px; color: #7D7871; border-top: 1px solid #E2DAD0;">
                    © ${new Date().getFullYear()} Divine You Ayurveda · support@contact.divineyou.net
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const { data } = await resend.emails.send({
      from: `Divine You <${SENDER_EMAIL}>`,
      to: [customerEmail],
      subject: `Refund Confirmation: ${orderId} · Divine You`,
      html: htmlContent,
    });
    console.log("✅ Resend Refund Processed Email Sent. ID:", data?.id);
  } catch (err) {
    console.warn("❌ Refund email error:", err.message);
  }
}