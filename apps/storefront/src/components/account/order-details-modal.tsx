"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Check,
  Truck,
  RotateCcw,
  Loader2,
  Home,
  Briefcase,
  Minus,
  Ban,
  ExternalLink,
  Clock,
  Undo2,
  CheckCircle2,
} from "lucide-react";
import { ReturnRequestModal } from "./return-request-modal";

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onOrderUpdated: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.divineyou.net";

export function OrderDetailsModal({
  isOpen,
  order,
  onClose,
  onOrderUpdated,
}: OrderDetailsModalProps) {
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancellingReturn, setCancellingReturn] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  if (!isOpen || !order) return null;

  const rawStatus = String(order.status || "CONFIRMED").toUpperCase().trim();

  const isConfirmed = rawStatus === "CONFIRMED" || rawStatus === "UNFULFILLED";
  const isProcessing = rawStatus === "PROCESSING";
  const isShipped = rawStatus === "SHIPPED" || rawStatus === "IN TRANSIT";
  const isOutForDelivery = rawStatus === "OUT_FOR_DELIVERY" || rawStatus === "OUT FOR DELIVERY";
  const isDelivered = rawStatus === "DELIVERED";
  const isCancelled = rawStatus === "CANCELLED";
  const isReturnRequested = rawStatus === "RETURN_REQUESTED";
  const isReturned = rawStatus === "RETURNED";

  const displayStatusLabel = isConfirmed
    ? "CONFIRMED"
    : isReturned
    ? "RETURNED · REFUNDED"
    : isReturnRequested
    ? "RETURN UNDER REVIEW"
    : rawStatus;

  const canCancel = isConfirmed || isProcessing;

  const deliveredDate = order.delivered_date ? new Date(order.delivered_date) : new Date(order.created_at);
  const daysSinceDelivery = Math.floor((new Date().getTime() - deliveredDate.getTime()) / (1000 * 3600 * 24));
  const isReturnEligible = isDelivered && daysSinceDelivery <= 15;

  const returnRequestedAt = order.return_details?.requested_at
    ? new Date(order.return_details.requested_at)
    : new Date(order.created_at);
  const hoursSinceReturnRequest = (new Date().getTime() - returnRequestedAt.getTime()) / (1000 * 60 * 60);
  const canCancelReturn = isReturnRequested && hoursSinceReturnRequest <= 24;
  const hoursLeftToCancelReturn = Math.max(1, Math.ceil(24 - hoursSinceReturnRequest));

  const items = Array.isArray(order.items) ? order.items : [];
  const address = typeof order.shipping_address === "object" ? order.shipping_address : {};

  const orderDateFormatted = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  const totalAmount = Number(order.amount || 0);
  const shippingAmount = Number(order.shipping_amount || (totalAmount > 999 ? 0 : 99));
  const subtotalAmount = Math.max(0, totalAmount - shippingAmount);

  const awbCode = order.awb_code || order.awb || null;
  const courierPartner = order.courier_name || order.courier_info || "Shiprocket Express";
  const destinationName = order.tracking_destination || address.city?.toUpperCase() || "DELIVERY LOCATION";

  const getCourierTrackingUrl = (courierName: string, awb: string) => {
    if (!awb) return "#";
    const cleanAwb = awb.trim();
    const courier = (courierName || "").toLowerCase();

    if (courier.includes("delhivery")) return `https://www.delhivery.com/track/package/${cleanAwb}`;
    if (courier.includes("bluedart")) return `https://www.bluedart.com/tracking?handler=tabwithtracking&action=subtracking&waybill=0&numbers=${cleanAwb}`;
    if (courier.includes("xpressbees")) return `https://www.xpressbees.com/track?iswaybill=true&values=${cleanAwb}`;
    if (courier.includes("shadowfax")) return `https://tracker.shadowfax.in/track?orderId=${cleanAwb}`;
    return `https://shiprocket.co/tracking/${cleanAwb}`;
  };

  const officialTrackingUrl = awbCode ? getCourierTrackingUrl(courierPartner, awbCode) : null;

  const trackingSteps = [
    { title: "Order Confirmed", date: orderDateFormatted, done: true },
    { title: "Processing in Facility", date: isProcessing || isShipped || isOutForDelivery || isDelivered || isReturnRequested || isReturned ? orderDateFormatted : "Pending", done: isProcessing || isShipped || isOutForDelivery || isDelivered || isReturnRequested || isReturned },
    { title: "Shipped / In Transit", date: isShipped || isOutForDelivery || isDelivered || isReturnRequested || isReturned ? orderDateFormatted : "Pending", done: isShipped || isOutForDelivery || isDelivered || isReturnRequested || isReturned },
    { title: "Out for Delivery", date: isOutForDelivery || isDelivered || isReturnRequested || isReturned ? orderDateFormatted : "Pending", done: isOutForDelivery || isDelivered || isReturnRequested || isReturned },
    { title: isReturned ? "Returned & Refunded" : "Delivered", date: order.delivered_date || (isDelivered || isReturnRequested || isReturned ? orderDateFormatted : "Pending"), done: isDelivered || isReturnRequested || isReturned },
  ];

  const handleCancelOrder = async () => {
    if (!window.confirm(`Are you sure you want to cancel Order ${order.id}?`)) return;

    setCancellingOrder(true);
    try {
      const res = await fetch(`${API_URL}/orders/cancel-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        onOrderUpdated();
        onClose();
      } else {
        alert(data.message || "Failed to cancel order.");
      }
    } catch (err: any) {
      alert("Failed to connect to backend server for cancellation.");
    } finally {
      setCancellingOrder(false);
    }
  };

  const handleCancelReturn = async () => {
    if (!window.confirm(`Are you sure you want to cancel your return request for Order ${order.id}? Your order will remain marked as Delivered.`)) {
      return;
    }

    setCancellingReturn(true);
    try {
      const res = await fetch(`${API_URL}/orders/cancel-return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        onOrderUpdated();
        onClose();
      } else {
        alert(data.message || "Failed to cancel return request.");
      }
    } catch (err: any) {
      alert("Failed to connect to backend server. Please try again.");
    } finally {
      setCancellingReturn(false);
    }
  };

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-sans"
      >
        <div className="relative w-full max-w-[640px] max-h-[90vh] overflow-y-auto rounded-[24px] border border-[#EBE5DA] bg-[#FDFBF7] p-6 sm:p-8 shadow-2xl text-[#2C2A29]">
          
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[#E2DAD0]/60">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#1C1A19]">
                  Order {order.id.startsWith("DY-") ? order.id : `DY-${order.id}`}
                </h2>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${
                    isReturned
                      ? "bg-[#D2DEC9] text-[#1D3B28] border-[#B2C7A8]"
                      : isDelivered
                      ? "bg-[#1D3B28] text-white border-[#1D3B28]"
                      : isShipped || isOutForDelivery
                      ? "bg-[#D2DEC9] text-[#1D3B28] border-[#B2C7A8]"
                      : isConfirmed || isProcessing
                      ? "bg-[#EFE8DC] text-[#6E6352] border-[#DED4C5]"
                      : isCancelled
                      ? "bg-[#FCE8E8] text-[#984242] border-[#F2C2C2]"
                      : isReturnRequested
                      ? "bg-[#FFF6E5] text-[#B37410] border-[#F5DCB0]"
                      : "bg-[#F3EFE6] text-[#77756C] border-[#DED8CA]"
                  }`}
                >
                  {displayStatusLabel}
                </span>
              </div>
              <p className="text-xs text-[#7D7871] mt-1">
                Placed on {orderDateFormatted} {order.shiprocket_order_id ? `· Shiprocket ID: #${order.shiprocket_order_id}` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-[#EFE9DF] text-[#7D7871] transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-6 pt-6">
            
            {/* RETURN APPROVED & REFUNDED BANNER */}
            {isReturned && (
              <div className="rounded-2xl bg-[#E2EBE0] border border-[#C5D8CD] p-5 flex items-start gap-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#1D3B28] text-[#1D3B28]">
                  <Check size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-lg font-normal text-[#1C1A19]">Return Approved & Refunded</h4>
                    <span className="rounded bg-[#1D3B28] text-white px-2 py-0.5 text-[9px] font-bold uppercase">
                      {order.payment_status || "REFUNDED"}
                    </span>
                  </div>
                  <p className="text-xs text-[#524E4A] mt-0.5">
                    Your return has been approved and a full refund of ₹{totalAmount.toLocaleString("en-IN")} has been credited back to your original source account.
                  </p>
                </div>
              </div>
            )}

            {/* Delivered Status Banner */}
            {isDelivered && !isReturned && (
              <div className="rounded-2xl bg-[#E2EBE0] border border-[#C5D8CD] p-5 flex items-start gap-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#1D3B28] text-[#1D3B28]">
                  <Check size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-lg font-normal text-[#1C1A19]">Delivered successfully</h4>
                    <span className="rounded bg-[#1D3B28] text-white px-2 py-0.5 text-[9px] font-bold uppercase">
                      15-Day Return Window Active
                    </span>
                  </div>
                  <p className="text-xs text-[#524E4A] mt-0.5">
                    Delivered on {order.delivered_date || orderDateFormatted} to {address.fullName || "Customer"}.
                  </p>
                </div>
              </div>
            )}

            {/* Cancelled Banner */}
            {isCancelled && (
              <div className="rounded-2xl bg-[#FCE8E8] border border-[#F2C2C2] p-5 flex items-start gap-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#984242] text-[#984242]">
                  <Ban size={15} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-normal text-[#984242]">Order Cancelled</h4>
                  <p className="text-xs text-[#702525] mt-0.5">
                    This order was cancelled. Any prepaid refund processed will reflect within 3-5 business days.
                  </p>
                </div>
              </div>
            )}

            {/* Return Requested Banner + 24-Hour Cancel Action */}
            {isReturnRequested && (
              <div className="rounded-2xl bg-[#FFF6E5] border border-[#F5DCB0] p-5 space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#B37410] text-[#B37410]">
                    <RotateCcw size={15} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-lg font-normal text-[#B37410]">Return Under Review</h4>
                      {canCancelReturn && (
                        <span className="text-[11px] font-bold text-[#8A580A]">
                          {hoursLeftToCancelReturn} hr{hoursLeftToCancelReturn > 1 ? "s" : ""} left to cancel
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8A580A] mt-0.5">
                      Your return photos have been submitted for admin approval. Our team will verify and schedule reverse pickup within 24-48 hours.
                    </p>
                  </div>
                </div>

                {canCancelReturn ? (
                  <div className="pt-1 flex items-center justify-end border-t border-[#F5DCB0]/70">
                    <button
                      type="button"
                      onClick={handleCancelReturn}
                      disabled={cancellingReturn}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#B37410] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#B37410] hover:bg-[#FFF2D6] transition cursor-pointer shadow-2xs"
                    >
                      {cancellingReturn ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />}
                      <span>Cancel Return Request</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#8A580A]/80 italic pt-1 border-t border-[#F5DCB0]/70">
                    24-hour return cancellation period has expired. Return is now locked for admin processing.
                  </p>
                )}
              </div>
            )}

            {/* Delivery Tracking Card (Active Orders Only) */}
            {!isCancelled && !isDelivered && !isReturnRequested && !isReturned && (
              <div className="rounded-2xl border border-[#EBE5DA] bg-[#F9F6F0] p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-[#7D7871]">
                  <span className="font-serif text-lg font-normal text-[#1C1A19]">Delivery Tracking</span>
                  <span className="font-medium text-[#1C1A19]">{courierPartner}</span>
                </div>

                <div className="rounded-xl bg-white border border-[#E2DAD0] p-5 space-y-4">
                  {awbCode ? (
                    <a
                      href={officialTrackingUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-xl border border-[#D2DEC9] bg-[#F4F8F3] p-4 transition-all hover:bg-[#E2EBE0] hover:border-[#1D3B28]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D3B28] text-white">
                            <Truck size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-base font-medium text-[#1C1A19] group-hover:text-[#1D3B28]">
                                {courierPartner} Live Tracking
                              </span>
                              <span className="rounded bg-[#1D3B28] px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                                Active AWB
                              </span>
                            </div>
                            <p className="text-xs text-[#524E4A] mt-0.5">AWB Code: <span className="font-bold text-[#1C1A19]">{awbCode}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-[#1D3B28] group-hover:translate-x-1 transition-transform">
                          <span>Live GPS</span>
                          <ExternalLink size={14} />
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#E0D8CB] bg-[#FDFBF7] p-4 flex items-center gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE8DC] text-[#6E6352]">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-xs text-[#1C1A19]">Shipment Preparing for Dispatch</p>
                        <p className="text-[11px] text-[#7D7871] mt-0.5">
                          Tracking link for <strong className="text-[#1C1A19]">{destinationName}</strong> will be generated once courier picks up the parcel.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-[#E2DAD0]/60 pt-3 text-[11px] text-[#7D7871]">
                    <span>Estimated Delivery:</span>
                    <span className="font-bold text-[#1C1A19]">{order.estimated_delivery || "Within 3-5 Business Days"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-2xl border border-[#EBE5DA] bg-[#F9F6F0] p-5 space-y-4 shadow-2xs">
              <h3 className="font-serif text-xl font-normal text-[#1C1A19]">Order Timeline</h3>
              <div className="space-y-4 pl-1">
                {trackingSteps.map((step: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 z-10 ${step.done ? "bg-[#1D3B28] text-white" : "border border-[#ded8ca] bg-white text-[#7D7871]"}`}>
                      {step.done ? <Check size={13} strokeWidth={2.5} /> : <Minus size={12} />}
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${step.done ? "text-[#1C1A19]" : "text-[#7D7871]"}`}>{step.title}</p>
                      <p className="text-[10px] text-[#7D7871]">{step.date || "Pending"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Products Card */}
            <div className="rounded-2xl border border-[#EBE5DA] bg-[#F9F6F0] p-5 space-y-4 shadow-2xs">
              <h3 className="font-serif text-xl font-normal text-[#1C1A19]">Ordered Products</h3>
              <div className="divide-y divide-[#E2DAD0]">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-[#E0D8CB] bg-white">
                        <Image src={item.image || "/images/products/hero-product.png"} alt={item.name || "Product"} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs sm:text-sm text-[#1C1A19]">{item.name || item.title || "Ayurvedic Product"}</p>
                        <p className="text-[11px] text-[#7D7871]">{item.size || "100 g"} · Qty {item.quantity || 1}</p>
                      </div>
                    </div>
                    <div className="font-semibold text-xs sm:text-sm text-[#1C1A19]">
                      ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E2DAD0] pt-3 space-y-2 text-xs text-[#524E4A]">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-medium text-[#1C1A19]">₹{subtotalAmount.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="font-medium text-[#1D3B28]">{shippingAmount === 0 ? "Free" : `₹${shippingAmount}`}</span></div>
                <div className="flex justify-between font-bold text-sm text-[#1C1A19] pt-2 border-t border-[#E2DAD0]"><span>Total Amount</span><span>₹{totalAmount.toLocaleString("en-IN")}</span></div>
              </div>
            </div>

            {/* Address & Payment Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#EBE5DA] bg-[#F9F6F0] p-4 space-y-2 shadow-2xs">
                <h4 className="font-serif text-lg font-normal text-[#1C1A19]">Delivery Address</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {address.type === "Work" ? <Briefcase size={15} /> : <Home size={15} />}
                    <span className="font-semibold text-xs text-[#1C1A19]">{address.type || "Home"}</span>
                  </div>
                  <div className="text-xs text-[#524E4A] leading-relaxed pt-1">
                    <p className="font-medium text-[#1C1A19]">{address.fullName || "Customer"}</p>
                    <p>{address.mobile || address.phone || ""}</p>
                    <p>{address.addressLine1} {address.addressLine2 ? `, ${address.addressLine2}` : ""}</p>
                    <p>{address.city}, {address.state} {address.pincode}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#EBE5DA] bg-[#F9F6F0] p-4 space-y-2 shadow-2xs">
                <h4 className="font-serif text-lg font-normal text-[#1C1A19]">Payment Method</h4>
                <div className="text-xs text-[#524E4A] space-y-1">
                  <p className="font-semibold text-[#1C1A19]">{order.payment_method || "UPI"}</p>
                  <p className="text-[10px] text-[#7D7871] uppercase tracking-wider">Payment Status: {order.payment_status || "PAID"}</p>
                </div>
              </div>
            </div>

            {/* Cancel Action */}
            {canCancel && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancellingOrder}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#F2C2C2] bg-[#FCE8E8] py-3 text-xs sm:text-sm font-semibold text-[#984242] hover:bg-[#F9D6D6] transition cursor-pointer shadow-2xs"
                >
                  {cancellingOrder ? <Loader2 size={16} className="animate-spin text-[#984242]" /> : <Ban size={16} />}
                  <span>Cancel Order (Instant Refund)</span>
                </button>
              </div>
            )}

            {/* Return Action with 15-Day Check */}
            {isReturnEligible && !isReturnRequested && !isReturned && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D3B28] py-3.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#152B1D] transition cursor-pointer shadow-xs"
                >
                  <RotateCcw size={16} />
                  <span>Request Return / Replacement</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Return Request Modal */}
      <ReturnRequestModal
        isOpen={isReturnModalOpen}
        order={order}
        onClose={() => setIsReturnModalOpen(false)}
        onSuccess={() => {
          onOrderUpdated();
          onClose();
        }}
      />
    </>
  );
}