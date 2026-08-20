"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  MapPin,
  LogOut,
  Plus,
  Home,
  Briefcase,
  Loader2,
  ChevronRight,
  RotateCcw,
  Ban,
} from "lucide-react";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/context/auth-context";
import { AddAddressModal } from "@/components/account/add-address-modal";
import { OrderDetailsModal } from "@/components/account/order-details-modal";
import { supabase } from "@/lib/supabaseClient";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "returns" | "cancellations" | "addresses">("orders");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [isSaved, setIsSaved] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    try {
      const { data: addressList } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (addressList) setAddresses(addressList);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }

    setOrdersLoading(true);
    try {
      const conditions: string[] = [];
      if (user.id) conditions.push(`user_id.eq.${user.id}`);
      if (user.email) conditions.push(`shipping_address->>email.eq.${user.email}`);
      if (user.phone) conditions.push(`shipping_address->>mobile.eq.${user.phone}`);

      const filterClause = conditions.length > 0 ? conditions.join(",") : `user_id.eq.${user.id}`;

      const { data: orderList, error } = await supabase
        .from("orders")
        .select("*")
        .or(filterClause)
        .order("created_at", { ascending: false });

      if (error) {
        const { data: fallbackOrders } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (fallbackOrders) setOrders(fallbackOrders);
      } else if (orderList) {
        setOrders(orderList);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }

      const fullName = user.name || "";
      const nameParts = fullName.trim().split(" ");
      setFormData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
      });

      fetchUserData();
    }
  }, [user, loading, router, fetchUserData]);

  const handleSaveAddress = async (addressData: any) => {
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
      if (!error) fetchUserData();
    } catch (err) {
      console.error("Error saving address:", err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase.from("user_addresses").delete().eq("id", id).eq("user_id", user.id);
      if (!error) setAddresses((prev) => prev.filter((a) => String(a.id) !== String(id)));
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbf9f3] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#285538] border-t-transparent mb-3" />
          <p className="text-xs text-[#66655d]">Loading account details...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  // Filter Segments
  const regularOrders = orders.filter(
    (o) => o.status !== "CANCELLED" && o.status !== "RETURN_REQUESTED" && o.status !== "RETURNED"
  );
  const returnedOrders = orders.filter(
    (o) => o.status === "RETURN_REQUESTED" || o.status === "RETURNED"
  );
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  return (
    <main className="min-h-screen bg-[#fbf9f3] text-[#243126] flex flex-col justify-between font-sans">
      <div>
        <TrustBar />
        <Header />

        <section className="mx-auto max-w-7xl px-6 lg:px-12 py-10 sm:py-14">
          
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-4xl sm:text-[48px] font-normal tracking-[-0.015em] text-[#243126]">
                My Account
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#66655d]">
                {formData.phone ? `${formData.phone} · ` : ""}
                {formData.email}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-[#ded8ca] bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#f3efe6] transition cursor-pointer self-start shadow-2xs"
            >
              <LogOut size={15} strokeWidth={1.8} />
              <span>Log out</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="inline-flex items-center gap-1 rounded-2xl bg-[#ede8de]/80 p-1 text-xs sm:text-sm mb-8 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition cursor-pointer ${
                activeTab === "profile" ? "bg-white text-[#243126] shadow-2xs" : "text-[#66655d] hover:text-[#243126]"
              }`}
            >
              <User size={15} strokeWidth={1.8} />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition cursor-pointer ${
                activeTab === "orders" ? "bg-white text-[#243126] shadow-2xs" : "text-[#66655d] hover:text-[#243126]"
              }`}
            >
              <Package size={15} strokeWidth={1.8} />
              <span>Orders ({regularOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("returns")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition cursor-pointer ${
                activeTab === "returns" ? "bg-white text-[#243126] shadow-2xs" : "text-[#66655d] hover:text-[#243126]"
              }`}
            >
              <RotateCcw size={15} strokeWidth={1.8} />
              <span>Returns ({returnedOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cancellations")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition cursor-pointer ${
                activeTab === "cancellations" ? "bg-white text-[#243126] shadow-2xs" : "text-[#66655d] hover:text-[#243126]"
              }`}
            >
              <Ban size={15} strokeWidth={1.8} />
              <span>Cancellations ({cancelledOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition cursor-pointer ${
                activeTab === "addresses" ? "bg-white text-[#243126] shadow-2xs" : "text-[#66655d] hover:text-[#243126]"
              }`}
            >
              <MapPin size={15} strokeWidth={1.8} />
              <span>Addresses</span>
            </button>
          </div>

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="w-full max-w-[540px]">
              <div className="rounded-[24px] border border-[#e8e2d4] bg-white p-6 sm:p-8 shadow-2xs">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 3000);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-[#243126] mb-1.5">First name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none focus:border-[#285538]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#243126] mb-1.5">Last name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] outline-none focus:border-[#285538]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#243126] mb-1.5">Email</label>
                    <input
                      type="email"
                      readOnly
                      value={formData.email}
                      className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] opacity-80 cursor-not-allowed"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-[#285538] px-6 py-2.5 text-xs sm:text-sm font-medium text-white shadow-2xs hover:bg-[#1f462c] transition cursor-pointer"
                    >
                      {isSaved ? "Saved!" : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="w-full space-y-4">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-16 text-[#66655d]">
                  <Loader2 size={24} className="animate-spin text-[#285538] mr-2" />
                  <span className="text-xs sm:text-sm">Fetching orders...</span>
                </div>
              ) : regularOrders.length === 0 ? (
                <div className="w-full min-h-[280px] rounded-[28px] border border-dashed border-[#ded8ca] bg-white/40 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d8e6d7] text-[#285538]"><Package size={26} /></div>
                  <h3 className="font-serif text-2xl font-normal text-[#243126]">No orders placed yet</h3>
                  <p className="text-xs text-[#66655d]">Explore our collection and place your first order.</p>
                  <button type="button" onClick={() => router.push("/shop")} className="mt-2 rounded-xl bg-[#285538] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white">Start Shopping</button>
                </div>
              ) : (
                regularOrders.map((order) => {
                  const orderDate = order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : "Recently";

                  const itemsCount = Array.isArray(order.items) ? order.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) : 1;
                  const statusUpper = String(order.status || "CONFIRMED").toUpperCase();
                  const isDelivered = statusUpper === "DELIVERED";
                  const isShipped = statusUpper === "SHIPPED" || statusUpper === "IN TRANSIT";

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-[24px] border border-[#e8e2d4] bg-white p-6 sm:p-7 flex items-center justify-between gap-4 shadow-2xs hover:border-[#285538]/40 transition cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-2xl font-normal text-[#243126]">Order {order.id.startsWith("DY-") ? order.id : `DY-${order.id}`}</h3>
                          <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                            isDelivered ? "bg-[#1D3B28] text-white border-[#1D3B28]" : isShipped ? "bg-[#D2DEC9] text-[#1D3B28] border-[#B2C7A8]" : "bg-[#EFE8DC] text-[#6E6352] border-[#DED4C5]"
                          }`}>
                            {statusUpper}
                          </span>
                        </div>
                        <p className="text-xs text-[#66655d]">Placed {orderDate} · {itemsCount} item{itemsCount > 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-semibold text-base sm:text-lg text-[#243126]">₹{Number(order.amount || 0).toLocaleString("en-IN")}</div>
                        <ChevronRight size={20} className="text-[#66655d] group-hover:text-[#285538] transition" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* RETURNS TAB (DYNAMIC STATUS RESOLUTION) */}
          {activeTab === "returns" && (
            <div className="w-full space-y-4">
              {returnedOrders.length === 0 ? (
                <div className="w-full min-h-[280px] rounded-[28px] border border-dashed border-[#ded8ca] bg-white/40 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3efe6] text-[#77756c]"><RotateCcw size={26} /></div>
                  <h3 className="font-serif text-2xl font-normal text-[#243126]">No returned items</h3>
                  <p className="text-xs text-[#66655d]">Delivered orders requested for return will appear here.</p>
                </div>
              ) : (
                returnedOrders.map((order) => {
                  const statusUpper = String(order.status || "").toUpperCase();
                  const isApproved = statusUpper === "RETURNED";
                  const isUnderReview = statusUpper === "RETURN_REQUESTED";

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-[24px] border border-[#e8e2d4] bg-white p-6 sm:p-7 flex items-center justify-between gap-4 shadow-2xs hover:border-[#285538]/40 transition cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-2xl font-normal text-[#243126]">
                            Order {order.id.startsWith("DY-") ? order.id : `DY-${order.id}`}
                          </h3>
                          
                          {/* Dynamic Return Status Badge */}
                          {isApproved ? (
                            <span className="rounded-md bg-[#D2DEC9] px-2.5 py-0.5 text-[10px] font-bold uppercase border border-[#B2C7A8] text-[#1D3B28]">
                              RETURN APPROVED · {order.payment_status === "REFUNDED" ? "REFUNDED" : "REFUND PROCESSED"}
                            </span>
                          ) : isUnderReview ? (
                            <span className="rounded-md bg-[#FFF6E5] px-2.5 py-0.5 text-[10px] font-bold uppercase border border-[#F5DCB0] text-[#B37410]">
                              RETURN UNDER REVIEW
                            </span>
                          ) : (
                            <span className="rounded-md bg-[#f3efe6] px-2.5 py-0.5 text-[10px] font-bold uppercase border border-[#ded8ca] text-[#77756c]">
                              {order.status}
                            </span>
                          )}
                        </div>

                        {/* Dynamic Subtitle */}
                        <p className="text-xs text-[#66655d]">
                          {isApproved
                            ? "Return approved! Refund has been initiated to your original payment method."
                            : "Photos under review by admin for reverse pickup."}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="font-semibold text-base sm:text-lg text-[#243126]">
                          ₹{Number(order.amount || 0).toLocaleString("en-IN")}
                        </div>
                        <ChevronRight size={20} className="text-[#66655d]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* CANCELLATIONS TAB */}
          {activeTab === "cancellations" && (
            <div className="w-full space-y-4">
              {cancelledOrders.length === 0 ? (
                <div className="w-full min-h-[280px] rounded-[28px] border border-dashed border-[#ded8ca] bg-white/40 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3efe6] text-[#77756c]"><Ban size={26} /></div>
                  <h3 className="font-serif text-2xl font-normal text-[#243126]">No cancelled orders</h3>
                  <p className="text-xs text-[#66655d]">Orders cancelled before shipment will be shown here.</p>
                </div>
              ) : (
                cancelledOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="rounded-[24px] border border-[#e8e2d4] bg-white p-6 sm:p-7 flex items-center justify-between gap-4 shadow-2xs hover:border-[#984242]/40 transition cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-serif text-2xl font-normal text-[#243126]">Order {order.id.startsWith("DY-") ? order.id : `DY-${order.id}`}</h3>
                        <span className="rounded-md bg-[#FCE8E8] px-2.5 py-0.5 text-[10px] font-bold uppercase border border-[#F2C2C2] text-[#984242]">
                          CANCELLED {order.payment_status === "REFUNDED" ? "· REFUNDED" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-[#66655d]">Cancelled before dispatch.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-semibold text-base sm:text-lg text-[#243126]">₹{Number(order.amount || 0).toLocaleString("en-IN")}</div>
                      <ChevronRight size={20} className="text-[#66655d]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div className="w-full">
              {addresses.length === 0 ? (
                <div className="w-full min-h-[280px] rounded-[28px] border border-dashed border-[#ded8ca] bg-white/40 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d8e6d7] text-[#285538]"><MapPin size={26} /></div>
                  <h3 className="font-serif text-2xl font-normal text-[#243126]">No saved addresses</h3>
                  <button type="button" onClick={() => { setEditingAddress(null); setIsModalOpen(true); }} className="mt-1 rounded-xl bg-[#285538] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white">
                    <Plus size={16} className="inline mr-1" /> Add New Address
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="rounded-[22px] border border-[#e8e2d4] bg-white p-6 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {addr.type === "Work" ? <Briefcase size={20} /> : <Home size={20} />}
                            <h3 className="font-serif text-2xl font-normal text-[#243126]">{addr.type || "Home"}</h3>
                            {addr.isDefault && <span className="rounded-md bg-[#f3efe6] px-2 py-0.5 text-[9px] font-semibold uppercase text-[#77756c] border border-[#ded8ca]">DEFAULT</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[#66655d]">
                            <button type="button" onClick={() => { setEditingAddress(addr); setIsModalOpen(true); }} className="hover:text-[#285538] hover:underline">Edit</button>
                            <span className="text-[#ded8ca]">|</span>
                            <button type="button" onClick={() => handleDeleteAddress(addr.id)} className="hover:text-red-700 hover:underline">Delete</button>
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-[#66655d] leading-relaxed space-y-1">
                          <p className="font-medium text-[#243126]">{addr.fullName}</p>
                          <p>{addr.mobile}</p>
                          <p>{addr.addressLine1} {addr.apartment && `, ${addr.apartment}`}</p>
                          <p>{addr.city}, {addr.state} {addr.pincode}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <button type="button" onClick={() => { setEditingAddress(null); setIsModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl border border-[#ded8ca] bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#f3efe6] transition">
                      <Plus size={15} /> Add New Address
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </section>
      </div>

      <AddAddressModal isOpen={isModalOpen} initialData={editingAddress} onClose={() => setIsModalOpen(false)} onSave={handleSaveAddress} />
      <OrderDetailsModal isOpen={!!selectedOrder} order={selectedOrder} onClose={() => setSelectedOrder(null)} onOrderUpdated={fetchUserData} />
      <Footer />
    </main>
  );
}