"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Check,
  Home,
  Briefcase,
  MapPin,
  Plus,
  Loader2,
  QrCode,
  CreditCard,
  Banknote,
  Truck,
} from "lucide-react";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { AddAddressModal } from "@/components/account/add-address-modal";
import API, { checkPincodeService } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { cart, subtotal, clearCart } = useCart();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Address States
  const [savedAddresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Validation & Shipping States
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [shippingEstimateInfo, setShippingEstimateInfo] = useState<string>("");
  const [isCodAllowed, setIsCodAllowed] = useState<boolean>(true);
  const [mobileError, setMobileError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Address Form State
  const [address, setAddress] = useState({
    fullName: "",
    mobile: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Credit Card" | "Cash on Delivery">("UPI");
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  const shippingFee = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const totalAmount = Math.max(0, subtotal + shippingFee);

  // Authentication Guard
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login?redirect=/checkout");
    }
  }, [isLoggedIn, authLoading, router]);

  // Fetch Saved Addresses from Supabase
  useEffect(() => {
    const fetchCheckoutAddresses = async () => {
      if (!user?.id) return;

      try {
        const { data: addressList, error } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (!error && addressList && addressList.length > 0) {
          setAddresses(addressList);
          const defaultAddr = addressList.find((a: any) => a.isDefault) || addressList[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setAddress({
              fullName: defaultAddr.fullName || user?.name || "",
              mobile: defaultAddr.mobile || "",
              addressLine1: defaultAddr.addressLine1 || "",
              addressLine2: defaultAddr.apartment || "",
              city: defaultAddr.city || "",
              state: defaultAddr.state || "",
              pincode: defaultAddr.pincode || "",
            });
            if (defaultAddr.pincode?.length === 6) {
              validatePincodeWithShiprocket(defaultAddr.pincode);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch checkout addresses:", err);
      }
    };

    fetchCheckoutAddresses();
  }, [user]);

  // Autofill user name
  useEffect(() => {
    if (user?.name && !address.fullName) {
      setAddress((prev) => ({ ...prev, fullName: user.name || "" }));
    }
  }, [user]);

  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setAddress((prev) => ({ ...prev, mobile: cleaned }));
    setMobileError(cleaned.length === 10 || cleaned.length === 0 ? "" : "Invalid Mobile Number (10 digits required).");
  };

  // Shiprocket Pincode & City/State Validator
  const validatePincodeWithShiprocket = async (pin: string) => {
    setPincodeLoading(true);
    setPincodeError("");
    setShippingEstimateInfo("");

    try {
      const data = await checkPincodeService(pin);

      if (data?.success && data?.serviceable) {
        setShippingEstimateInfo(`Estimated Delivery: ${data.estimatedDelivery} via ${data.courierName}`);
        setIsCodAllowed(data.codAvailable !== false);
        if (data.city && !address.city) {
          setAddress((prev) => ({ ...prev, city: data.city }));
        }
      } else {
        setPincodeError(data?.message || "Delivery currently unavailable at this pincode.");
      }

      // Autofill City & State fallback
      if (!address.city || !address.state) {
        const postRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const postData = await postRes.json();
        if (postData?.[0]?.Status === "Success" && postData[0].PostOffice?.length > 0) {
          const po = postData[0].PostOffice[0];
          setAddress((prev) => ({
            ...prev,
            city: prev.city || po.District || po.Division || "",
            state: prev.state || po.State || "",
          }));
        }
      }
    } catch (err) {
      console.warn("Shiprocket serviceability lookup warning:", err);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleCheckoutPincodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setAddress((prev) => ({ ...prev, pincode: cleaned }));

    if (cleaned.length === 6) {
      validatePincodeWithShiprocket(cleaned);
    } else {
      setPincodeError("");
      setShippingEstimateInfo("");
    }
  };

  const handleSaveModalAddress = async (addressData: any) => {
    if (!user?.id) return;

    try {
      const addressId = addressData.id || `addr_${Date.now()}`;

      if (addressData.isDefault) {
        await supabase.from("user_addresses").update({ isDefault: false }).eq("user_id", user.id);
      }

      const payload = {
        id: addressId,
        user_id: user.id,
        fullName: addressData.fullName,
        mobile: addressData.mobile,
        addressLine1: addressData.addressLine1,
        apartment: addressData.apartment || "",
        pincode: addressData.pincode,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country || "India",
        type: addressData.type || "Home",
        isDefault: !!addressData.isDefault,
      };

      const { error } = await supabase.from("user_addresses").upsert(payload, { onConflict: "id" });

      if (!error) {
        const { data: updatedList } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (updatedList) {
          setAddresses(updatedList);
          setSelectedAddressId(addressId);
        }
      }
    } catch (err) {
      console.error("Error saving address:", err);
    }
  };

  const handleContinueWithSavedAddress = () => {
    const chosen = savedAddresses.find((a) => String(a.id) === String(selectedAddressId));
    if (chosen) {
      setAddress({
        fullName: chosen.fullName || user?.name || "",
        mobile: chosen.mobile || "",
        addressLine1: chosen.addressLine1 || "",
        addressLine2: chosen.apartment || "",
        city: chosen.city || "",
        state: chosen.state || "",
        pincode: chosen.pincode || "",
      });
      if (chosen.pincode?.length === 6) {
        validatePincodeWithShiprocket(chosen.pincode);
      }
    }
    setStep(2);
  };

  const handleNewAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(address.mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (user?.id) {
      try {
        await supabase.from("user_addresses").upsert({
          id: `addr_${Date.now()}`,
          user_id: user.id,
          fullName: address.fullName,
          mobile: address.mobile,
          addressLine1: address.addressLine1,
          apartment: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: "India",
          type: "Home",
          isDefault: savedAddresses.length === 0,
        });
      } catch (err) {
        console.error("Auto-save address exception:", err);
      }
    }

    setStep(2);
  };

  // Main Place Order Trigger
  const handlePlaceOrder = async () => {
    if (!agreedTerms || cart.length === 0) return;
    setIsPlacingOrder(true);

    try {
      // 1. CASH ON DELIVERY
      if (paymentMethod === "Cash on Delivery") {
        const response = await API.post("/orders/verify-payment", {
          paymentMethod: "Cash on Delivery",
          totalAmount,
          shippingAddress: address,
          cartItems: cart,
          userId: user?.id,
          userEmail: user?.email,
        });

        if (response.data?.success) {
          setPlacedOrderId(response.data.orderId);
          setEstimatedDelivery(shippingEstimateInfo || "Within 3-5 Business Days");
          setStep(4);
          clearCart();
        } else {
          alert(response.data?.message || "Failed to place COD order.");
        }
        setIsPlacingOrder(false);
        return;
      }

      // 2. PREPAID ONLINE PAYMENT (Razorpay)
      const orderRes = await API.post("/orders/create-razorpay-order", {
        amount: totalAmount,
        currency: "INR",
      });

      if (!orderRes.data?.success) {
        throw new Error("Could not initialize Razorpay order.");
      }

      const { order_id, amount, currency, key_id } = orderRes.data;

      const options: any = {
        key: key_id,
        amount,
        currency,
        name: "Divine You Ayurveda",
        description: "Pure Botanical Essentials",
        image: "/images/brand/divine-you-logo.png",
        order_id,
        prefill: {
          name: address.fullName || user?.name || "",
          email: user?.email || "",
          contact: address.mobile || "",
          method: paymentMethod === "Credit Card" ? "card" : "upi",
        },
        theme: { color: "#285538" },
        handler: async function (paymentResponse: any) {
          try {
            const verifyRes = await API.post("/orders/verify-payment", {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              paymentMethod,
              totalAmount,
              shippingAddress: address,
              cartItems: cart,
              userId: user?.id,
              userEmail: user?.email,
            });

            if (verifyRes.data?.success) {
              setPlacedOrderId(verifyRes.data.orderId);
              setEstimatedDelivery(shippingEstimateInfo || "Within 3-5 Business Days");
              setStep(4);
              clearCart();
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            alert("Payment verification error.");
          } finally {
            setIsPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => setIsPlacingOrder(false),
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert("Razorpay SDK not loaded. Please refresh the page.");
        setIsPlacingOrder(false);
      }
    } catch (err: any) {
      console.error("Place Order Error:", err);
      alert(err.message || "Failed to process order.");
      setIsPlacingOrder(false);
    }
  };

  if (authLoading || !isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#fbf9f3] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#285538] border-t-transparent mb-3" />
          <p className="text-xs text-[#66655d]">Redirecting to sign in...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf9f3] text-[#243126] flex flex-col justify-between font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div>
        <TrustBar />
        <Header />

        <section className="mx-auto max-w-7xl px-6 lg:px-12 py-10 sm:py-14">
          
          {/* Stepper Progress Bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-medium tracking-wider uppercase text-[#66655d] mb-10 pb-4 border-b border-[#ded8ca]/60">
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? "bg-[#285538] text-white" : "bg-[#e8e2d4] text-[#66655d]"}`}>
                {step > 1 ? <Check size={14} strokeWidth={2.5} /> : "1"}
              </span>
              <span className={step === 1 ? "text-[#243126] font-semibold" : ""}>ADDRESS</span>
            </div>
            <div className="h-px w-6 bg-[#ded8ca]" />
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? "bg-[#285538] text-white" : "bg-[#e8e2d4] text-[#66655d]"}`}>
                {step > 2 ? <Check size={14} strokeWidth={2.5} /> : "2"}
              </span>
              <span className={step === 2 ? "text-[#243126] font-semibold" : ""}>PAYMENT</span>
            </div>
            <div className="h-px w-6 bg-[#ded8ca]" />
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 3 ? "bg-[#285538] text-white" : "bg-[#e8e2d4] text-[#66655d]"}`}>
                {step > 3 ? <Check size={14} strokeWidth={2.5} /> : "3"}
              </span>
              <span className={step === 3 ? "text-[#243126] font-semibold" : ""}>REVIEW</span>
            </div>
            <div className="h-px w-6 bg-[#ded8ca]" />
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === 4 ? "bg-[#285538] text-white" : "bg-[#e8e2d4] text-[#66655d]"}`}>
                4
              </span>
              <span className={step === 4 ? "text-[#243126] font-semibold" : ""}>CONFIRMATION</span>
            </div>
          </div>

          {/* STEP 4: ORDER CONFIRMATION VIEW */}
          {step === 4 ? (
            <div className="mx-auto max-w-2xl py-8">
              <div className="rounded-[28px] border border-[#e8e2d4] bg-white p-8 sm:p-12 text-center shadow-xs space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d8e6d7] text-[#285538]">
                  <Check size={32} strokeWidth={2.5} />
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#243126]">
                    Thank you for your order!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#66655d]">
                    A confirmation email will be sent to <span className="font-semibold text-[#243126]">{user?.email}</span>.
                  </p>
                </div>

                <div className="divide-y divide-[#ded8ca]/80 border-t border-b border-[#ded8ca]/80 py-4 text-xs sm:text-sm space-y-3">
                  <div className="flex justify-between pt-2">
                    <span className="text-[#66655d]">Order ID</span>
                    <span className="font-semibold text-[#243126]">{placedOrderId}</span>
                  </div>
                  <div className="flex justify-between pt-3">
                    <span className="text-[#66655d]">Estimated Delivery</span>
                    <span className="font-semibold text-[#243126]">{estimatedDelivery}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <Link href="/shop" className="w-full sm:w-auto rounded-xl bg-[#285538] px-7 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition">
                    Continue Shopping
                  </Link>
                  <Link href="/account" className="w-full sm:w-auto rounded-xl border border-[#ded8ca] bg-[#f3efe6]/80 px-7 py-3 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#e8e2d4] transition">
                    View Orders
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              
              {/* LEFT COLUMN: STEPS */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* STEP 1: ADDRESS */}
                {step === 1 && (
                  savedAddresses.length > 0 ? (
                    <div className="space-y-6">
                      <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#243126]">
                        Delivery Address
                      </h2>

                      <div className="space-y-4">
                        {savedAddresses.map((addr) => {
                          const isSelected = String(addr.id) === String(selectedAddressId);
                          return (
                            <div
                              key={addr.id}
                              onClick={() => {
                                setSelectedAddressId(addr.id);
                                if (addr.pincode) validatePincodeWithShiprocket(addr.pincode);
                              }}
                              className={`rounded-[22px] border p-6 sm:p-7 transition cursor-pointer relative ${
                                isSelected
                                  ? "border-[#285538] bg-[#fbf9f3]/40 ring-1 ring-[#285538]"
                                  : "border-[#e8e2d4] bg-white hover:border-[#a39f93]"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${isSelected ? "border-[#285538] bg-[#285538]" : "border-[#ded8ca] bg-white"}`}>
                                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {addr.type === "Work" ? <Briefcase size={18} /> : <Home size={18} />}
                                    <h3 className="font-serif text-2xl font-normal text-[#243126]">{addr.type || "Home"}</h3>
                                    {addr.isDefault && (
                                      <span className="rounded-md bg-[#f3efe6] px-2 py-0.5 text-[9px] font-semibold uppercase text-[#77756c] border border-[#ded8ca]">
                                        DEFAULT
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAddress(addr);
                                    setIsAddressModalOpen(true);
                                  }}
                                  className="text-xs text-[#66655d] hover:text-[#285538] hover:underline"
                                >
                                  Edit
                                </button>
                              </div>
                              <div className="pl-8 text-xs sm:text-sm text-[#66655d] leading-relaxed">
                                <p className="font-medium text-[#243126]">{addr.fullName}</p>
                                <p>{addr.mobile}</p>
                                <p>{addr.addressLine1} {addr.apartment ? `, ${addr.apartment}` : ""}</p>
                                <p>{addr.city}, {addr.state} {addr.pincode}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {shippingEstimateInfo && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs">
                          <Truck size={16} className="text-emerald-700 shrink-0" />
                          <span>{shippingEstimateInfo}</span>
                        </div>
                      )}

                      <div>
                        <button
                          type="button"
                          onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#ded8ca] bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#f3efe6] transition"
                        >
                          <Plus size={15} />
                          <span>Add New Address</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <button
                          type="button"
                          onClick={handleContinueWithSavedAddress}
                          className="rounded-xl bg-[#285538] px-7 py-3.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition"
                        >
                          Continue to Payment
                        </button>
                        <Link href="/cart" className="rounded-xl border border-[#ded8ca] bg-[#f3efe6] px-6 py-3.5 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#e8e2d4] transition">
                          Back to Cart
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-[#e8e2d4] bg-white p-6 sm:p-8 shadow-2xs space-y-6">
                      <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">
                        Shipping Address
                      </h2>
                      <form onSubmit={handleNewAddressSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">Full name</label>
                            <input
                              type="text"
                              required
                              placeholder="Enter your full name"
                              value={address.fullName}
                              onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                              className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none focus:border-[#285538]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">Mobile number</label>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              placeholder="10-digit mobile number"
                              value={address.mobile}
                              onChange={(e) => handleMobileChange(e.target.value)}
                              className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none focus:border-[#285538]"
                            />
                            {mobileError && <p className="text-[10px] text-red-600 mt-1">{mobileError}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">Address line 1</label>
                          <input
                            type="text"
                            required
                            placeholder="House/Flat No., Building Name, Street"
                            value={address.addressLine1}
                            onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                            className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none focus:border-[#285538]"
                          />
                        </div>

                        <div>
                          <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">Address line 2 (optional)</label>
                          <input
                            type="text"
                            placeholder="Locality, Landmark"
                            value={address.addressLine2}
                            onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                            className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none focus:border-[#285538]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">Pincode</label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                maxLength={6}
                                placeholder="6-digit Pincode"
                                value={address.pincode}
                                onChange={(e) => handleCheckoutPincodeChange(e.target.value)}
                                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none focus:border-[#285538]"
                              />
                              {pincodeLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#285538]" />}
                            </div>
                            {pincodeError && <p className="text-[10px] text-red-600 mt-1">{pincodeError}</p>}
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">City</label>
                            <input
                              type="text"
                              required
                              value={address.city}
                              onChange={(e) => setAddress({ ...address, city: e.target.value })}
                              className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none focus:border-[#285538]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">State</label>
                            <input
                              type="text"
                              required
                              value={address.state}
                              onChange={(e) => setAddress({ ...address, state: e.target.value })}
                              className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none focus:border-[#285538]"
                            />
                          </div>
                        </div>

                        {shippingEstimateInfo && (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2.5 rounded-xl text-xs mt-2">
                            <Truck size={15} className="text-emerald-700 shrink-0" />
                            <span>{shippingEstimateInfo}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-4">
                          <button type="submit" className="rounded-xl bg-[#285538] px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition">
                            Continue to Payment
                          </button>
                          <Link href="/shop" className="rounded-xl border border-[#ded8ca] bg-[#f3efe6] px-5 py-3 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#e8e2d4] transition">
                            Continue Shopping
                          </Link>
                        </div>
                      </form>
                    </div>
                  )
                )}

                {/* STEP 2: PAYMENT METHOD */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">
                      Select Payment Method
                    </h2>
                    <div className="space-y-3">
                      
                      {/* UPI */}
                      <div
                        onClick={() => setPaymentMethod("UPI")}
                        className={`rounded-[20px] border p-5 transition cursor-pointer ${paymentMethod === "UPI" ? "border-[#285538] bg-white ring-1 ring-[#285538]" : "border-[#e8e2d4] bg-white hover:border-[#a39f93]"}`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" checked={paymentMethod === "UPI"} onChange={() => setPaymentMethod("UPI")} className="accent-[#285538]" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-serif text-lg font-normal text-[#243126]">UPI (Google Pay / PhonePe / QR)</h3>
                              <QrCode size={18} className="text-[#285538]" />
                            </div>
                            <p className="text-xs text-[#66655d] mt-0.5">Instant scan & pay via any UPI App.</p>
                          </div>
                        </div>
                      </div>

                      {/* Card */}
                      <div
                        onClick={() => setPaymentMethod("Credit Card")}
                        className={`rounded-[20px] border p-5 transition cursor-pointer ${paymentMethod === "Credit Card" ? "border-[#285538] bg-white ring-1 ring-[#285538]" : "border-[#e8e2d4] bg-white hover:border-[#a39f93]"}`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" checked={paymentMethod === "Credit Card"} onChange={() => setPaymentMethod("Credit Card")} className="accent-[#285538]" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-serif text-lg font-normal text-[#243126]">Credit / Debit Card</h3>
                              <CreditCard size={18} className="text-[#285538]" />
                            </div>
                            <p className="text-xs text-[#66655d] mt-0.5">Visa, Mastercard, RuPay cards accepted.</p>
                          </div>
                        </div>
                      </div>

                      {/* Cash on Delivery */}
                      <div
                        onClick={() => isCodAllowed && setPaymentMethod("Cash on Delivery")}
                        className={`rounded-[20px] border p-5 transition ${!isCodAllowed ? "opacity-50 cursor-not-allowed bg-stone-100" : "cursor-pointer"} ${paymentMethod === "Cash on Delivery" ? "border-[#285538] bg-white ring-1 ring-[#285538]" : "border-[#e8e2d4] bg-white hover:border-[#a39f93]"}`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" disabled={!isCodAllowed} checked={paymentMethod === "Cash on Delivery"} onChange={() => setPaymentMethod("Cash on Delivery")} className="accent-[#285538]" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-serif text-lg font-normal text-[#243126]">Cash on Delivery (COD)</h3>
                              <Banknote size={18} className="text-[#285538]" />
                            </div>
                            <p className="text-xs text-[#66655d] mt-0.5">
                              {isCodAllowed ? "Pay in cash or UPI when your parcel arrives." : "COD unavailable for this pincode."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <button type="button" onClick={() => setStep(3)} className="rounded-xl bg-[#285538] px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition">
                        Continue to Review
                      </button>
                      <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-[#ded8ca] bg-[#f3efe6] px-5 py-3 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#e8e2d4] transition">
                        Back to Address
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="font-serif text-2xl font-normal text-[#243126]">Order Review</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-[20px] border border-[#e8e2d4] bg-white p-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-lg font-normal text-[#243126]">Shipping Address</h3>
                          <button type="button" onClick={() => setStep(1)} className="text-xs text-[#285538] hover:underline">Edit</button>
                        </div>
                        <p className="text-xs text-[#66655d] leading-relaxed">
                          {address.fullName}<br />
                          {address.addressLine1} {address.addressLine2 && `, ${address.addressLine2}`}<br />
                          {address.city} {address.state} {address.pincode}<br />
                          {address.mobile}
                        </p>
                      </div>
                      <div className="rounded-[20px] border border-[#e8e2d4] bg-white p-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-lg font-normal text-[#243126]">Payment Method</h3>
                          <button type="button" onClick={() => setStep(2)} className="text-xs text-[#285538] hover:underline">Change</button>
                        </div>
                        <p className="text-xs text-[#66655d] font-semibold">{paymentMethod}</p>
                        {shippingEstimateInfo && <p className="text-[11px] text-emerald-800">{shippingEstimateInfo}</p>}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[#e8e2d4] bg-white p-6 space-y-4">
                      <h3 className="font-serif text-lg font-normal text-[#243126]">Ordered Products</h3>
                      <div className="divide-y divide-[#ded8ca]/80">
                        {cart.map((item) => (
                          <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#ded8ca] bg-white">
                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                              </div>
                              <div>
                                <h4 className="font-serif text-sm text-[#243126]">{item.name}</h4>
                                <p className="text-[11px] text-[#66655d]">{item.size} · Qty {item.quantity}</p>
                              </div>
                            </div>
                            <span className="font-semibold text-xs sm:text-sm text-[#243126]">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 text-xs text-[#66655d] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#285538]"
                      />
                      <span>I agree to the Terms & Conditions and Privacy Policy.</span>
                    </label>

                    <div className="flex items-center gap-4 pt-2">
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={!agreedTerms || cart.length === 0 || isPlacingOrder}
                        className={`rounded-xl px-7 py-3 text-xs sm:text-sm font-semibold text-white transition flex items-center gap-2 ${
                          agreedTerms && cart.length > 0 && !isPlacingOrder ? "bg-[#285538] hover:bg-[#1f462c]" : "bg-[#77756c] opacity-60 cursor-not-allowed"
                        }`}
                      >
                        {isPlacingOrder && <Loader2 size={16} className="animate-spin" />}
                        <span>{isPlacingOrder ? "Placing Order..." : "Place Order"}</span>
                      </button>
                      <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-[#ded8ca] bg-[#f3efe6] px-5 py-3 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#e8e2d4] transition">
                        Back to Payment
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN: ORDER SUMMARY */}
              <div className="lg:col-span-5">
                <div className="rounded-[24px] border border-[#e8e2d4] bg-white p-6 sm:p-7 shadow-2xs space-y-6 sticky top-28">
                  <h2 className="font-serif text-2xl font-normal text-[#243126]">Order Summary</h2>
                  <div className="divide-y divide-[#ded8ca]/80 max-h-[300px] overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#ded8ca] bg-white">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div>
                            <h4 className="font-serif text-sm font-normal text-[#243126]">{item.name}</h4>
                            <p className="text-[11px] text-[#66655d]">{item.size} · Qty {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-xs text-[#243126]">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#ded8ca] pt-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between text-[#66655d]">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[#243126]">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[#66655d]">
                      <span>Shipping</span>
                      <span className="font-medium text-[#285538]">{shippingFee === 0 ? "Free" : `₹${shippingFee}`}</span>
                    </div>
                    <div className="border-t border-[#ded8ca] pt-3.5 flex justify-between font-bold text-base text-[#243126]">
                      <span>Total</span>
                      <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </section>
      </div>

      <AddAddressModal
        isOpen={isAddressModalOpen}
        initialData={editingAddress}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveModalAddress}
      />

      <Footer />
    </main>
  );
}