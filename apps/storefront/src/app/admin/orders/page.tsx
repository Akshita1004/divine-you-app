"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Loader2,
  X,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ZoomIn,
  Copy,
  Video,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface OrderItem {
  id?: string;
  name?: string;
  title?: string;
  product_name?: string;
  quantity?: number;
  qty?: number;
  price?: number;
}

interface AddressJSON {
  fullName?: string;
  full_name?: string;
  name?: string;
  customer_name?: string;
  mobile?: string;
  phone?: string;
  addressLine1?: string;
  address_line1?: string;
  address?: string;
  apartment?: string;
  pincode?: string;
  zip?: string;
  city?: string;
  state?: string;
  country?: string;
  type?: string;
}

interface ReturnDetails {
  reason?: string;
  comments?: string;
  images?: string[];
  video?: string | null;
  requested_at?: string;
  admin_status?: string;
  refund_id?: string;
  admin_notes?: string;
  rejection_reason?: string;
  cod_payout_details?: {
    type?: string;
    upi_id?: string;
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  raw_date: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address_str: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  return_status?: string;
  return_details?: ReturnDetails;
  courier_info?: string;
  awb_code?: string;
  tracking_destination?: string;
  estimated_delivery?: string;
  items: OrderItem[];
}

const SORT_OPTIONS = [
  { value: "latest", label: "Latest Orders" },
  { value: "oldest", label: "Oldest Orders" },
  { value: "amount_high", label: "Total: High to Low" },
  { value: "amount_low", label: "Total: Low to High" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Return Processing States
  const [processingReturn, setProcessingReturn] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Filters & Sorting States
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "FULFILLED" | "RETURNS" | "CANCELLED">("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "amount_high" | "amount_low">("latest");
  const [searchQuery, setSearchQuery] = useState("");

  // Dropdown state
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  function nameFromEmail(emailStr?: string): string {
    if (emailStr && emailStr.includes("@")) {
      const username = emailStr.split("@")[0];
      return username
        .replace(/[._-]/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    return "Guest Customer";
  }

  function getNormalizedStatus(status: string): string {
    const s = (status || "").toUpperCase();
    if (s.includes("RETURN_REQUESTED") || s.includes("RETURN REQUESTED")) return "Return Requested";
    if (s.includes("RETURNED")) return "Returned";
    if (s.includes("CONFIRM")) return "Confirmed";
    if (s.includes("FACILITY") || s.includes("PROCESS")) return "Processing";
    if (s.includes("TRANSIT") || s.includes("SHIP")) return "Shipped";
    if (s.includes("OUT")) return "Out for Delivery";
    if (s.includes("DELIVERED")) return "Delivered";
    if (s.includes("CANCEL")) return "Cancelled";
    return "Confirmed";
  }

  async function fetchOrders() {
    try {
      setLoading(true);

      const [ordersRes, profilesRes, userAddrRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("user_addresses").select("*"),
      ]);

      const data = ordersRes.data || [];
      const profiles = profilesRes.data || [];
      const userAddresses = userAddrRes.data || [];

      const profileMap = new Map<string, any>();
      profiles.forEach((p: any) => {
        if (p.id) profileMap.set(p.id, p);
      });

      const userAddrMap = new Map<string, any>();
      userAddresses.forEach((addr: any) => {
        if (addr.user_id) {
          if (addr.isDefault || !userAddrMap.has(addr.user_id)) {
            userAddrMap.set(addr.user_id, addr);
          }
        }
      });

      if (data) {
        const formatted: Order[] = data.map((item: any) => {
          let addrObj: AddressJSON = {};
          if (typeof item.shipping_address === "string") {
            try {
              addrObj = JSON.parse(item.shipping_address);
            } catch {
              addrObj = { addressLine1: item.shipping_address };
            }
          } else if (item.shipping_address) {
            addrObj = item.shipping_address;
          }

          const prof = item.user_id ? profileMap.get(item.user_id) : null;
          const userAddr = item.user_id ? userAddrMap.get(item.user_id) : null;

          let resolvedName =
            addrObj.fullName ||
            addrObj.full_name ||
            addrObj.name ||
            userAddr?.fullName ||
            prof?.full_name ||
            prof?.name ||
            item.customer_name;

          if (!resolvedName || resolvedName.trim() === "") {
            resolvedName = nameFromEmail(item.customer_email || prof?.email);
          }

          const resolvedPhone =
            addrObj.mobile ||
            addrObj.phone ||
            userAddr?.mobile ||
            prof?.phone ||
            item.customer_phone ||
            "N/A";

          const addressLine1 = addrObj.addressLine1 || addrObj.address_line1 || addrObj.address || userAddr?.addressLine1;
          const apartment = addrObj.apartment || userAddr?.apartment;
          const city = addrObj.city || userAddr?.city;
          const state = addrObj.state || userAddr?.state;
          const pincode = addrObj.pincode || addrObj.zip || userAddr?.pincode;
          const country = addrObj.country || userAddr?.country;

          const addressParts = [
            addressLine1,
            apartment,
            city,
            state,
            pincode,
            country,
          ].filter((val) => Boolean(val && String(val).trim() !== ""));

          let parsedItems: OrderItem[] = [];
          if (typeof item.items === "string") {
            try {
              parsedItems = JSON.parse(item.items);
            } catch {
              parsedItems = [];
            }
          } else if (Array.isArray(item.items)) {
            parsedItems = item.items;
          }

          const createdAtDate = new Date(item.created_at || Date.now());

          return {
            id: String(item.id),
            raw_date: createdAtDate.getTime(),
            created_at: createdAtDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            customer_name: resolvedName,
            customer_email: item.customer_email || prof?.email || "N/A",
            customer_phone: resolvedPhone,
            shipping_address_str:
              addressParts.length > 0 ? addressParts.join(", ") : "Address on File",
            total_amount: Number(item.amount || item.total_amount || 0),
            payment_method: item.payment_method || "Cash on Delivery",
            payment_status: item.payment_status || "PENDING",
            status: getNormalizedStatus(item.status),
            return_status: item.return_status || "NONE",
            return_details: item.return_details || null,
            courier_info: item.courier_name || item.courier_info || "Shiprocket Express",
            awb_code: item.awb_code || item.awb || null,
            tracking_destination: city || "DELIVERY LOCATION",
            estimated_delivery: item.estimated_delivery || "N/A",
            items: parsedItems,
          };
        });

        setOrders(formatted);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveReturn(order: Order) {
    const isCOD = order.payment_method === "Cash on Delivery" || order.payment_status === "PENDING";
    let codRef = null;

    if (isCOD) {
      codRef = prompt(
        `Order ${order.id} is Cash on Delivery. Transfer ₹${order.total_amount} to customer's UPI/Bank details shown above.\nEnter Transaction UTR / Ref No:`,
        `UPI-REF-${Date.now()}`
      );
      if (codRef === null) return;
    } else {
      if (!window.confirm(`Approve return for Order ${order.id}? This will automatically process a full Razorpay refund directly to customer's source account.`)) {
        return;
      }
    }

    setProcessingReturn(true);
    try {
      const response = await fetch(`${API_URL}/orders/admin/approve-return-refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          adminNotes: "Return verified and refund approved by admin.",
          codTransactionRef: codRef,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert("Failed to approve return: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to connect to backend server.");
    } finally {
      setProcessingReturn(false);
    }
  }

  async function handleRejectReturn(orderId: string) {
    const reason = prompt("Enter reason for declining this return (will be logged):", "Photos/Videos do not show manufacturing defect.");
    if (reason === null) return;

    setProcessingReturn(true);
    try {
      const response = await fetch(`${API_URL}/orders/admin/reject-return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          rejectionReason: reason,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert("Failed to reject return: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to connect to backend server.");
    } finally {
      setProcessingReturn(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const processedOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const normStatus = getNormalizedStatus(order.status);

        if (activeTab === "PENDING") {
          if (normStatus !== "Confirmed" && normStatus !== "Processing") return false;
        } else if (activeTab === "FULFILLED") {
          if (
            normStatus !== "Shipped" &&
            normStatus !== "Out for Delivery" &&
            normStatus !== "Delivered"
          )
            return false;
        } else if (activeTab === "RETURNS") {
          if (normStatus !== "Return Requested" && normStatus !== "Returned") return false;
        } else if (activeTab === "CANCELLED") {
          if (normStatus !== "Cancelled") return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesId = order.id.toLowerCase().includes(q);
          const matchesName = order.customer_name.toLowerCase().includes(q);
          return matchesId || matchesName;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "latest") return b.raw_date - a.raw_date;
        if (sortBy === "oldest") return a.raw_date - b.raw_date;
        if (sortBy === "amount_high") return b.total_amount - a.total_amount;
        if (sortBy === "amount_low") return a.total_amount - b.total_amount;
        return 0;
      });
  }, [orders, activeTab, sortBy, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => {
        const s = getNormalizedStatus(o.status);
        return s === "Confirmed" || s === "Processing";
      }).length,
      fulfilled: orders.filter((o) => {
        const s = getNormalizedStatus(o.status);
        return s === "Shipped" || s === "Out for Delivery" || s === "Delivered";
      }).length,
      returns: orders.filter((o) => {
        const s = getNormalizedStatus(o.status);
        return s === "Return Requested" || s === "Returned";
      }).length,
      cancelled: orders.filter((o) => getNormalizedStatus(o.status) === "Cancelled").length,
    };
  }, [orders]);

  const getBadgeStyle = (status: string) => {
    const s = getNormalizedStatus(status);
    switch (s) {
      case "Return Requested":
        return "bg-[#FFF6E5] text-[#B37410] border border-[#F5DCB0]";
      case "Returned":
        return "bg-[#D2DEC9] text-[#1D3B28] border border-[#B2C7A8]";
      case "Delivered":
        return "bg-[#243126] text-white border border-[#243126]";
      case "Out for Delivery":
        return "bg-[#335338] text-white border border-[#335338]";
      case "Shipped":
        return "bg-[#dce6d8] text-[#243126] border border-[#c4d4be]";
      case "Processing":
        return "bg-[#eee8d8] text-[#554c38] border border-[#ded5be]";
      case "Confirmed":
        return "bg-[#e2ebd8] text-[#1e3b2b] border border-[#c8d9ba]";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      default:
        return "bg-[#ded8ca] text-[#243126] border border-[#ccc5b5]";
    }
  };

  const currentSortObj = SORT_OPTIONS.find((s) => s.value === sortBy) || SORT_OPTIONS[0];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header Bar */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#243126] font-medium tracking-tight">
          Orders & Returns
        </h1>
        <p className="text-xs sm:text-sm text-[#66655d]">
          Manage order fulfillment, review customer return photos & videos, and process refunds.
        </p>
      </div>

      {/* Controls Container */}
      <div className="bg-white rounded-2xl border border-[#e8e2d4]/80 p-3.5 sm:p-4 space-y-3">
        
        {/* Search Bar & Sort Dropdown Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-2.5 text-[#807d73]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order ID or name..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#ded8ca] bg-[#fbf9f3] text-xs outline-none focus:border-[#285538] text-[#243126]"
            />
          </div>

          <div className="relative shrink-0">
            {isSortOpen && (
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsSortOpen(false)}
              />
            )}
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="bg-[#fbf9f3] hover:bg-[#f3efe6] border border-[#ded8ca] rounded-xl px-3 py-2 text-xs font-medium text-[#243126] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <ArrowUpDown size={13} className="text-[#243126]" />
              <span className="hidden sm:inline">{currentSortObj.label}</span>
              <span className="sm:hidden">Sort</span>
              {isSortOpen ? (
                <ChevronUp size={13} className="text-[#66655d]" />
              ) : (
                <ChevronDown size={13} className="text-[#66655d]" />
              )}
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#fbf8f1] border border-[#ded8ca]/90 rounded-2xl shadow-xl p-1.5 z-30 space-y-1">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = opt.value === sortBy;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value as any);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? "bg-[#dce6d8] text-[#243126] font-medium"
                          : "text-[#243126] hover:bg-[#f3efe6]/80 font-normal"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={13} className="text-[#243126]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Scrollable Clean Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === "ALL"
                ? "bg-[#243126] text-white shadow-sm"
                : "bg-[#fbf9f3] text-[#66655d] border border-[#ded8ca]/60 hover:text-[#243126]"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === "PENDING"
                ? "bg-[#243126] text-white shadow-sm"
                : "bg-[#fbf9f3] text-[#66655d] border border-[#ded8ca]/60 hover:text-[#243126]"
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("FULFILLED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === "FULFILLED"
                ? "bg-[#243126] text-white shadow-sm"
                : "bg-[#fbf9f3] text-[#66655d] border border-[#ded8ca]/60 hover:text-[#243126]"
            }`}
          >
            Fulfilled ({counts.fulfilled})
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab("RETURNS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
              activeTab === "RETURNS"
                ? "bg-[#B37410] text-white shadow-sm"
                : "bg-[#FFF6E5] text-[#B37410] border border-[#F5DCB0]/80 hover:bg-[#FDEED2]"
            }`}
          >
            <RotateCcw size={11} />
            <span>Returns ({counts.returns})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CANCELLED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === "CANCELLED"
                ? "bg-[#243126] text-white shadow-sm"
                : "bg-[#fbf9f3] text-[#66655d] border border-[#ded8ca]/60 hover:text-[#243126]"
            }`}
          >
            Cancelled ({counts.cancelled})
          </button>
        </div>

      </div>

      {/* Orders View Container */}
      <div className="bg-white rounded-2xl border border-[#e8e2d4]/80 overflow-hidden shadow-none">
        {loading ? (
          <div className="p-16 flex justify-center text-[#807d73]">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : processedOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#807d73]">
            No orders found matching your active filters.
          </div>
        ) : (
          <>
            {/* Desktop View Table (Untouched) */}
            <div className="hidden sm:block overflow-x-auto min-h-[320px]">
              <table className="w-full text-left text-xs text-[#243126]">
                <thead className="bg-[#fbf9f3] text-[#807d73] uppercase tracking-[0.15em] text-[10px] font-semibold border-b border-[#e8e2d4]/70">
                  <tr>
                    <th className="p-5 font-semibold">ORDER</th>
                    <th className="p-5 font-semibold">DATE</th>
                    <th className="p-5 font-semibold">CUSTOMER</th>
                    <th className="p-5 font-semibold">COURIER</th>
                    <th className="p-5 font-semibold">TOTAL</th>
                    <th className="p-5 font-semibold">STATUS</th>
                    <th className="p-5 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3efe6]">
                  {processedOrders.map((order) => {
                    const normStatus = getNormalizedStatus(order.status);
                    const isReturn = normStatus === "Return Requested";

                    return (
                      <tr key={order.id} className={`hover:bg-[#fbf9f3]/60 transition-colors ${isReturn ? "bg-[#FFFDF9]" : ""}`}>
                        <td className="p-5 font-medium text-[#243126]">
                          <div className="flex items-center gap-1.5">
                            <span>{order.id}</span>
                            {isReturn && (
                              <span className="h-2 w-2 rounded-full bg-[#B37410] animate-pulse" title="Needs Return Review" />
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-[#66655d]">{order.created_at}</td>
                        <td className="p-5 font-medium text-[#243126]">{order.customer_name}</td>
                        <td className="p-5 text-[#66655d]">
                          <div>
                            <p className="font-medium text-[#243126]">{order.courier_info}</p>
                            {order.awb_code && (
                              <p className="text-[10px] text-[#807D73] font-mono">AWB: {order.awb_code}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-5 font-semibold text-[#243126]">
                          ₹{order.total_amount.toLocaleString("en-IN")}
                        </td>
                        <td className="p-5">
                          <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase ${getBadgeStyle(order.status)}`}>
                            {normStatus}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className={`font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                              isReturn
                                ? "bg-[#FFF6E5] text-[#B37410] border border-[#F5DCB0] hover:bg-[#FDEED2]"
                                : "text-[#243126] hover:text-[#285538] hover:underline"
                            }`}
                          >
                            {isReturn ? "Review Return" : "View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View Card List (No Horizontal Scroll) */}
            <div className="block sm:hidden space-y-3.5 p-4">
              {processedOrders.map((order) => {
                const normStatus = getNormalizedStatus(order.status);
                const isReturn = normStatus === "Return Requested";

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl p-4 border space-y-3 shadow-xs ${
                      isReturn ? "bg-[#FFFDF9] border-[#F5DCB0]" : "bg-white border-[#e8e2d4]/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-serif text-sm font-medium text-[#243126]">
                            {order.id}
                          </p>
                          {isReturn && (
                            <span className="h-2 w-2 rounded-full bg-[#B37410] animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#243126] mt-0.5">
                          {order.customer_name}
                        </p>
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase shrink-0 ${getBadgeStyle(order.status)}`}>
                        {normStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#66655d] pt-1 border-t border-[#f3efe6]">
                      <span>{order.created_at}</span>
                      <span className="font-semibold text-xs text-[#243126]">
                        ₹{order.total_amount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-[#f3efe6] text-xs">
                      <span className="text-[#807d73] text-[11px] truncate max-w-[180px]">
                        {order.courier_info}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className={`font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer text-xs flex items-center gap-1 ${
                          isReturn
                            ? "bg-[#FFF6E5] text-[#B37410] border border-[#F5DCB0]"
                            : "bg-[#f3efe6] text-[#243126] hover:bg-[#e8e2d4]"
                        }`}
                      >
                        <span>{isReturn ? "Review Return" : "View Details"}</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Details & Return Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ded8ca] max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Top */}
            <div className="flex items-center justify-between border-b border-[#f3efe6] pb-4 sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#243126]">
                    Order {selectedOrder.id}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${getBadgeStyle(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-[#807d73]">Placed on {selectedOrder.created_at}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-[#807d73] hover:text-[#243126] p-1.5 rounded-full hover:bg-[#f3efe6] transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Return Inspection Section */}
            {selectedOrder.return_details && (
              <div className="rounded-2xl border-2 border-[#F5DCB0] bg-[#FFFBF4] p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#F5DCB0]/70 pb-3">
                  <div className="flex items-center gap-2 text-[#B37410]">
                    <RotateCcw size={18} />
                    <h4 className="font-serif text-base font-semibold">Customer Return Request</h4>
                  </div>
                  <span className="text-[11px] font-bold text-[#8A580A] bg-[#FFF2D6] px-2.5 py-0.5 rounded-md border border-[#F5DCB0]">
                    {selectedOrder.return_details.admin_status || "PENDING REVIEW"}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-[#554C38]">
                  <p><strong className="text-[#1C1A19]">Reason:</strong> {selectedOrder.return_details.reason || "N/A"}</p>
                  {selectedOrder.return_details.comments && (
                    <p className="bg-white p-3 rounded-xl border border-[#F5DCB0]/60 italic text-[#443F35]">
                      &quot;{selectedOrder.return_details.comments}&quot;
                    </p>
                  )}
                  <p className="text-[11px] text-[#807D73]">
                    Requested on: {selectedOrder.return_details.requested_at ? new Date(selectedOrder.return_details.requested_at).toLocaleString("en-GB") : "Recently"}
                  </p>
                </div>

                {/* Uploaded Photos Gallery */}
                {selectedOrder.return_details.images && selectedOrder.return_details.images.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-[#1C1A19] block">
                      Customer Uploaded Photos ({selectedOrder.return_details.images.length}):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {selectedOrder.return_details.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewImage(img)}
                          className="relative h-20 rounded-xl border border-[#ded8ca] overflow-hidden group cursor-pointer shadow-2xs hover:border-[#B37410] transition bg-[#f3efe6]"
                        >
                          <Image src={img} alt="Return Proof" fill unoptimized className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                            <ZoomIn size={16} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uploaded Video Proof Player */}
                {selectedOrder.return_details.video && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-[#1C1A19] block flex items-center gap-1.5">
                      <Video size={14} className="text-[#285538]" />
                      <span>Customer Uploaded Video Proof:</span>
                    </span>
                    <div className="relative h-36 w-full rounded-xl border border-[#ded8ca] bg-black overflow-hidden shadow-2xs">
                      <video src={selectedOrder.return_details.video} className="h-full w-full object-contain" controls />
                    </div>
                  </div>
                )}

                {/* COD Customer Payout Box */}
                {selectedOrder.return_details.cod_payout_details && (
                  <div className="rounded-xl border border-[#E8DFC9] bg-white p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#8A580A] font-semibold border-b border-[#F5DCB0]/50 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={14} />
                        Customer Refund Account ({selectedOrder.return_details.cod_payout_details.type})
                      </span>
                      <span className="text-[10px] bg-[#FFF2D6] px-2 py-0.5 rounded border border-[#F5DCB0]">
                        COD Refund Destination
                      </span>
                    </div>

                    {selectedOrder.return_details.cod_payout_details.type === "UPI" ? (
                      <div className="flex items-center justify-between bg-[#FAF6EC] p-2.5 rounded-lg border border-[#E8DFC9]">
                        <div>
                          <p className="text-[10px] text-[#807D73]">CUSTOMER UPI ID</p>
                          <p className="font-semibold text-sm text-[#1C1A19]">
                            {selectedOrder.return_details.cod_payout_details.upi_id}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedOrder.return_details?.cod_payout_details?.upi_id || "")}
                          className="inline-flex items-center gap-1 bg-white border border-[#ded8ca] px-3 py-1.5 rounded-md text-xs font-semibold text-[#285538] hover:bg-[#f3efe6] transition cursor-pointer"
                        >
                          <Copy size={12} />
                          <span>{copiedText ? "Copied!" : "Copy UPI"}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 bg-[#FAF6EC] p-2.5 rounded-lg border border-[#E8DFC9] text-[11px]">
                        <p><strong className="text-[#807D73]">Holder:</strong> {selectedOrder.return_details.cod_payout_details.account_holder_name}</p>
                        <p><strong className="text-[#807D73]">Account No:</strong> <span className="font-semibold font-mono text-[#1C1A19]">{selectedOrder.return_details.cod_payout_details.account_number}</span></p>
                        <p><strong className="text-[#807D73]">IFSC Code:</strong> <span className="font-semibold font-mono text-[#1C1A19]">{selectedOrder.return_details.cod_payout_details.ifsc_code}</span></p>
                      </div>
                    )}
                  </div>
                )}

                {/* Return Action Buttons */}
                {selectedOrder.status === "Return Requested" && (
                  <div className="pt-3 border-t border-[#F5DCB0]/80 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      disabled={processingReturn}
                      onClick={() => handleApproveReturn(selectedOrder)}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D3B28] py-2.5 text-xs font-semibold text-white hover:bg-[#152B1D] transition cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {processingReturn ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      <span>
                        {selectedOrder.payment_method === "Cash on Delivery" ? "Approve & Mark Refunded" : "Approve & Refund (Razorpay)"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={processingReturn}
                      onClick={() => handleRejectReturn(selectedOrder.id)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#F2C2C2] bg-[#FCE8E8] px-4 py-2.5 text-xs font-semibold text-[#984242] hover:bg-[#F9D6D6] transition cursor-pointer disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Customer & Address Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-[#fbf9f3] p-4 rounded-xl border border-[#e8e2d4]/70">
                <MapPin size={18} className="text-[#285538] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1.5 w-full">
                  <p className="font-semibold text-sm text-[#243126]">{selectedOrder.customer_name}</p>
                  <div className="text-[#55534a] leading-relaxed break-words whitespace-normal border-t border-[#e8e2d4]/50 pt-1.5 mt-1">
                    <span className="font-medium text-[#807d73] block text-[11px] uppercase tracking-wider mb-0.5">Delivery Address:</span>
                    {selectedOrder.shipping_address_str}
                  </div>
                  <div className="pt-1 text-[#66655d] space-y-0.5">
                    <p><span className="text-[#807d73]">Email:</span> {selectedOrder.customer_email}</p>
                    <p><span className="text-[#807d73]">Phone:</span> {selectedOrder.customer_phone}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-[#fbf9f3] p-3 rounded-xl border border-[#e8e2d4]/70">
                  <CreditCard size={15} className="text-[#285538] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[#807d73] text-[10px]">PAYMENT</p>
                    <p className="font-medium text-[#243126] break-words">{selectedOrder.payment_method}</p>
                    <p className="text-[10px] text-[#7D7871] uppercase">Status: {selectedOrder.payment_status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-[#fbf9f3] p-3 rounded-xl border border-[#e8e2d4]/70">
                  <Truck size={15} className="text-[#285538] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[#807d73] text-[10px]">COURIER</p>
                    <p className="font-medium text-[#243126] break-words">{selectedOrder.courier_info}</p>
                    {selectedOrder.awb_code && (
                      <p className="text-[10px] text-[#285538] font-bold">AWB: {selectedOrder.awb_code}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-3">
              <h4 className="font-serif text-sm font-medium text-[#243126] flex items-center gap-2">
                <Package size={16} />
                <span>Order Items</span>
              </h4>

              <div className="divide-y divide-[#f3efe6] border border-[#e8e2d4]/70 rounded-xl overflow-hidden">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-[#243126]">
                          {item.name || item.title || item.product_name || "Ayurvedic Botanical Product"}
                        </p>
                        <p className="text-[#807d73] mt-0.5">Qty: {item.quantity || item.qty || 1}</p>
                      </div>
                      {item.price && (
                        <span className="font-semibold text-[#243126]">
                          ₹{((item.price) * (item.quantity || item.qty || 1)).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-[#807d73] text-center">No item breakdown details found</div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-[#f3efe6] flex items-center justify-between text-sm">
              <span className="font-medium text-[#66655d]">Total Amount</span>
              <span className="font-serif text-xl font-bold text-[#243126]">
                ₹{selectedOrder.total_amount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 rounded-xl bg-[#243126] text-white text-xs font-semibold hover:bg-[#1a231b] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Photo Zoom Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full h-[500px] rounded-2xl overflow-hidden bg-black">
            <Image src={previewImage} alt="Zoomed Proof" fill unoptimized className="object-contain" />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-sm transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}