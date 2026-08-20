"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Package,
  Truck,
  MapPin,
  Check,
  Minus,
  Loader2,
  AlertCircle,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function TrackOrderPage() {
  const [orderIdInput, setOrderIdInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);

  // Universal Courier Tracking URL Generator
  const getCourierTrackingUrl = (courierName: string, awbCode: string) => {
    if (!awbCode) return null;
    const cleanAwb = awbCode.trim();
    const courier = (courierName || "").toLowerCase();

    if (courier.includes("delhivery")) {
      return `https://www.delhivery.com/track/package/${cleanAwb}`;
    } else if (courier.includes("bluedart")) {
      return `https://www.bluedart.com/tracking?handler=tabwithtracking&action=subtracking&waybill=0&numbers=${cleanAwb}`;
    } else if (courier.includes("shiprocket")) {
      return `https://shiprocket.co/tracking/${cleanAwb}`;
    } else if (courier.includes("ekart")) {
      return `https://ekartlogistics.com/shipmenttrack/${cleanAwb}`;
    } else if (courier.includes("xpressbees")) {
      return `https://www.xpressbees.com/track?iswaybill=true&values=${cleanAwb}`;
    } else if (courier.includes("shadowfax")) {
      return `https://tracker.shadowfax.in/track?orderId=${cleanAwb}`;
    } else if (courier.includes("dtdc")) {
      return `https://www.dtdc.in/tracking/shipment-tracking.asp`;
    } else if (courier.includes("post") || courier.includes("speed")) {
      return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
    }

    // Default Fallback
    return `https://www.delhivery.com/track/package/${cleanAwb}`;
  };

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setTrackedOrder(null);

    const cleanId = orderIdInput.trim().toUpperCase();
    const cleanMobile = mobileInput.trim().replace(/\D/g, "");

    if (!cleanId) {
      setErrorMsg("Please enter a valid Order ID.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`id.eq.${cleanId},id.eq.DY-${cleanId}`)
        .maybeSingle();

      if (error || !data) {
        setErrorMsg("Order not found. Please check your Order ID.");
        setLoading(false);
        return;
      }

      // Verification by Mobile Number
      const savedMobile = data.shipping_address?.mobile || "";
      if (cleanMobile && savedMobile && !savedMobile.includes(cleanMobile)) {
        setErrorMsg("Mobile number does not match with the order details.");
        setLoading(false);
        return;
      }

      setTrackedOrder(data);
    } catch (err) {
      console.error("Tracking lookup exception:", err);
      setErrorMsg("Failed to fetch tracking details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const status = String(trackedOrder?.status || "PROCESSING").toUpperCase();
  const isDelivered = status === "DELIVERED";
  const isShipped = status === "SHIPPED" || status === "IN TRANSIT";
  const isCancelled = status === "CANCELLED";

  const address = typeof trackedOrder?.shipping_address === "object" ? trackedOrder.shipping_address : {};
  const originName = trackedOrder?.tracking_origin || "HARIDWAR FACILITY";
  const destinationName =
    trackedOrder?.tracking_destination || address.city?.toUpperCase() || "DELIVERY LOCATION";

  const awbCode = trackedOrder?.awb_code;
  const courierPartner = trackedOrder?.courier_name || trackedOrder?.courier_info || "Delhivery";
  const officialTrackingUrl = awbCode ? getCourierTrackingUrl(courierPartner, awbCode) : null;

  // Dynamic Map Visual Calculations
  let progressPercentage = 25;
  let currentBadgeLabel = "PROCESSING";
  let truckPositionX = "32%";

  if (isShipped) {
    progressPercentage = 65;
    currentBadgeLabel = "IN TRANSIT";
    truckPositionX = "58%";
  } else if (status === "OUT_FOR_DELIVERY" || status === "OUT FOR DELIVERY") {
    progressPercentage = 85;
    currentBadgeLabel = "OUT FOR DELIVERY";
    truckPositionX = "80%";
  } else if (isDelivered) {
    progressPercentage = 100;
    currentBadgeLabel = "DELIVERED";
    truckPositionX = "90%";
  }

  const defaultSteps = [
    { title: "Order Confirmed", date: "Placed", done: true },
    { title: "Processing in Facility", date: "In Progress", done: true },
    { title: "Shipped / In Transit", date: isShipped || isDelivered ? "In Transit" : "Pending", done: isShipped || isDelivered },
    { title: "Out for Delivery", date: isDelivered ? "Out" : "Pending", done: isDelivered },
    { title: "Delivered", date: trackedOrder?.delivered_date || "Pending", done: isDelivered },
  ];

  const trackingSteps =
    Array.isArray(trackedOrder?.tracking_steps) && trackedOrder.tracking_steps.length > 0
      ? trackedOrder.tracking_steps
      : defaultSteps;

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C2A29] font-sans flex flex-col justify-between">
      <div>
        <TrustBar />
        <Header />

        <section className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
          <div className="text-center space-y-3 mb-10">
            <span className="rounded-full bg-[#E2EBE0] px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#1D3B28]">
              Universal Logistics Tracking
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#1C1A19]">
              Track Your Order
            </h1>
            <p className="text-xs sm:text-sm text-[#7D7871] max-w-md mx-auto">
              Enter your Order ID (e.g. DY-84920) to check live shipment updates directly from our courier partners.
            </p>
          </div>

          {/* Search Card */}
          <div className="rounded-[28px] border border-[#EBE5DA] bg-[#F9F6F0] p-6 sm:p-8 shadow-xs mb-10">
            <form onSubmit={handleTrackSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1A19] mb-1.5">
                    Order ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DY-10294"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    className="w-full rounded-xl border border-[#E0D8CB] bg-white px-4 py-3 text-xs sm:text-sm text-[#1C1A19] placeholder:text-[#9E988F] focus:border-[#1D3B28] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1A19] mb-1.5">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Registered 10-digit mobile"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value)}
                    className="w-full rounded-xl border border-[#E0D8CB] bg-white px-4 py-3 text-xs sm:text-sm text-[#1C1A19] placeholder:text-[#9E988F] focus:border-[#1D3B28] outline-none transition"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-[#FCE8E8] border border-[#F2C2C2] p-3 text-xs text-[#984242]">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D3B28] py-3.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#152B1D] transition cursor-pointer shadow-xs"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                <span>{loading ? "Searching Logistics..." : "Track Package"}</span>
              </button>
            </form>
          </div>

          {/* TRACKING RESULT DISPLAY */}
          {trackedOrder && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Order Meta & Official External Tracking Button */}
              <div className="rounded-2xl border border-[#EBE5DA] bg-[#F9F6F0] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-2xl font-normal text-[#1C1A19]">
                      {trackedOrder.id}
                    </h3>
                    <span
                      className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${
                        isDelivered
                          ? "bg-[#1D3B28] text-white border-[#1D3B28]"
                          : isShipped
                          ? "bg-[#D2DEC9] text-[#1D3B28] border-[#B2C7A8]"
                          : isCancelled
                          ? "bg-[#FCE8E8] text-[#984242] border-[#F2C2C2]"
                          : "bg-[#EFE8DC] text-[#6E6352] border-[#DED4C5]"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  {awbCode && (
                    <p className="text-xs text-[#7D7871] mt-1">
                      AWB / Tracking No: <span className="font-semibold text-[#1C1A19]">{awbCode}</span> ({courierPartner})
                    </p>
                  )}
                </div>

                {/* DIRECT OFFICIAL COURIER LINK BUTTON */}
                {officialTrackingUrl ? (
                  <a
                    href={officialTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#285538] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1f462c] transition shadow-2xs"
                  >
                    <Navigation size={14} />
                    <span>Live GPS on {courierPartner}</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <div className="text-xs text-[#7D7871]">
                    Logistics Partner: <span className="font-semibold text-[#1C1A19]">{courierPartner}</span>
                  </div>
                )}
              </div>

              {/* Visual Map Route */}
              {!isCancelled && (
                <div className="rounded-2xl border border-[#EBE5DA] bg-[#F9F6F0] p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#7D7871]">
                    <span className="font-serif text-lg font-normal text-[#1C1A19]">
                      Shipment Route
                    </span>
                    <span className="font-medium text-[#1C1A19]">
                      {courierPartner}
                    </span>
                  </div>

                  <div className="relative w-full h-56 rounded-xl bg-[#F4F0E8] border border-[#E2DAD0] p-4 flex flex-col justify-between overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-25 pointer-events-none"
                      style={{
                        backgroundImage:
                          "linear-gradient(#2C2A29 1px, transparent 1px), linear-gradient(90deg, #2C2A29 1px, transparent 1px)",
                        backgroundSize: "22px 22px",
                      }}
                    />

                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 500 160"
                      fill="none"
                    >
                      <path
                        d="M 60 115 Q 250 15, 440 60"
                        stroke="#2D4A32"
                        strokeWidth="3"
                        strokeDasharray="6 6"
                        opacity="0.8"
                      />
                      <path
                        d="M 60 115 Q 250 135, 440 60"
                        stroke="#C69B56"
                        strokeWidth="1.5"
                        opacity="0.45"
                      />
                    </svg>

                    <div className="relative z-10 w-full h-full">
                      <div className="absolute left-4 bottom-5 flex flex-col items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E0D8CB] shadow-2xs text-[#524E4A]">
                          <Package size={16} />
                        </div>
                        <span className="text-[9px] font-bold tracking-wider text-[#7D7871] uppercase mt-1">
                          {originName}
                        </span>
                      </div>

                      <div
                        className="absolute bottom-11 flex flex-col items-center -translate-x-1/2 transition-all duration-700 ease-out"
                        style={{ left: truckPositionX }}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D3B28] text-white shadow-md">
                          <Truck size={18} />
                        </div>
                        <span className="text-[9px] font-bold tracking-wider text-[#1D3B28] uppercase mt-1 bg-white px-2 py-0.5 rounded-full border border-[#E0D8CB]">
                          {currentBadgeLabel}
                        </span>
                      </div>

                      <div className="absolute right-4 bottom-8 flex flex-col items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E0D8CB] shadow-2xs text-[#1C1A19]">
                          <MapPin size={16} />
                        </div>
                        <span className="text-[9px] font-bold tracking-wider text-[#1C1A19] uppercase mt-1">
                          {destinationName}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 w-full h-1.5 rounded-full bg-[#E2DAD0] overflow-hidden mt-1">
                      <div
                        className="h-full bg-[#1D3B28] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-[#7D7871] text-center">
                    Estimated arrival date:{" "}
                    <span className="font-semibold text-[#1C1A19]">
                      {trackedOrder.estimated_delivery || "2-3 Business Days"}
                    </span>
                  </p>
                </div>
              )}

              {/* Logs */}
              <div className="rounded-2xl border border-[#EBE5DA] bg-[#F9F6F0] p-6 space-y-4">
                <h3 className="font-serif text-xl font-normal text-[#1C1A19]">
                  Activity Logs
                </h3>

                <div className="space-y-4 pl-1">
                  {trackingSteps.map((step: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
                          step.done
                            ? "bg-[#1D3B28] text-white"
                            : "border border-[#E0D8CB] bg-white text-[#7D7871]"
                        }`}
                      >
                        {step.done ? <Check size={13} strokeWidth={2.5} /> : <Minus size={12} />}
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${step.done ? "text-[#1C1A19]" : "text-[#7D7871]"}`}>
                          {step.title}
                        </p>
                        <p className="text-[10px] text-[#7D7871]">
                          {step.date || "Pending"} {step.location ? `· ${step.location}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}