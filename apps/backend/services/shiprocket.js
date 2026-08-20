let cachedToken = null;
let tokenExpiry = null;

// 1. Shiprocket Auth Token Generate & Cache
export async function getShiprocketToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.token) {
    console.error("Shiprocket Login Error:", data);
    throw new Error(data.message || "Failed to authenticate with Shiprocket");
  }

  cachedToken = data.token;
  tokenExpiry = now + 8 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

// 2. Check Serviceability & Courier Estimation
export async function checkServiceability(deliveryPincode, weightKg = 0.5) {
  const token = await getShiprocketToken();
  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE;

  const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weightKg}&cod=0`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
}

// 3. Fetch Registered Pickup Warehouse Origin from Shiprocket
export async function getShiprocketPickupOrigin() {
  try {
    const token = await getShiprocketToken();

    const response = await fetch("https://apiv2.shiprocket.in/v1/external/settings/company/pickup", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data?.data?.shipping_address?.length > 0) {
      const primaryLoc =
        data.data.shipping_address.find((loc) => loc.is_primary_location === 1) ||
        data.data.shipping_address[0];

      const cityName = (primaryLoc.city || primaryLoc.pickup_location || "CENTRAL").toUpperCase();
      return `${cityName} FACILITY`;
    }

    return "DIVINE YOU FULFILLMENT CENTER";
  } catch (err) {
    console.error("Failed to fetch Shiprocket pickup location:", err.message);
    return "DIVINE YOU FULFILLMENT CENTER";
  }
}

// 4. Create Order on Shiprocket Dashboard
export async function createShiprocketOrder({
  orderId,
  orderDate,
  address,
  items,
  totalAmount,
  paymentMethod,
  userEmail,
}) {
  const token = await getShiprocketToken();

  const isCOD = paymentMethod === "Cash on Delivery";
  const nameParts = (address.fullName || "Customer").trim().split(" ");
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "User";

  const phone = (address.mobile || address.phone || "9999999999").replace(/\D/g, "");
  const email = address.email || userEmail || "support@divineyou.net";

  const d = new Date(orderDate);
  const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const orderItems = items.map((item, idx) => ({
    name: item.name || item.title || "Ayurvedic Botanical Product",
    sku: String(item.id || `SKU-${idx + 1}`),
    units: Number(item.quantity || 1),
    selling_price: Number(item.price || 0),
    discount: 0,
    tax: 0,
  }));

  const payload = {
    order_id: orderId,
    order_date: formattedDate,
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: address.addressLine1 || "Street Address",
    billing_address_2: address.addressLine2 || address.apartment || "",
    billing_city: address.city || "New Delhi",
    billing_pincode: String(address.pincode),
    billing_state: address.state || "Delhi",
    billing_country: "India",
    billing_email: email,
    billing_phone: phone,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: isCOD ? "COD" : "Prepaid",
    sub_total: Number(totalAmount),
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  };

  const response = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}

// 5. Cancel Order on Shiprocket Dashboard
export async function cancelShiprocketOrder(shiprocketOrderId) {
  if (!shiprocketOrderId) return { success: false, message: "No Shiprocket Order ID provided" };
  const token = await getShiprocketToken();

  const response = await fetch("https://apiv2.shiprocket.in/v1/external/orders/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ids: [Number(shiprocketOrderId)],
    }),
  });

  return await response.json();
}