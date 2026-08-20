"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    totalCount,
  } = useCart();

  return (
    <main className="min-h-screen bg-[#fbf9f3] text-[#243126] flex flex-col justify-between">
      <div>
        <TrustBar />
        <Header />

        <section className="mx-auto max-w-7xl px-6 lg:px-12 py-10 sm:py-14">
          <h1 className="font-serif text-4xl sm:text-[48px] font-normal tracking-[-0.015em] text-[#243126] mb-8 sm:mb-12">
            Your Cart
          </h1>

          {cart.length === 0 ? (
            /* Empty State */
            <div className="my-12 flex flex-col items-center justify-center rounded-[24px] border border-[#e8e2d4] bg-white p-12 text-center shadow-xs">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e2ebe4] text-[#285538] mb-5">
                <ShoppingBag size={28} strokeWidth={2.2} />
              </div>
              <h2 className="font-serif text-2xl font-normal text-[#243126]">
                Your cart is currently empty
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#66655d] max-w-sm leading-relaxed">
                Once you add a jar or two, they'll show up here.
              </p>
              <Link
                href="/shop"
                className="mt-6 rounded-xl bg-[#285538] px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition cursor-pointer"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            /* Full Cart Page matching Reference Screenshot */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              
              {/* Left Column: Items List */}
              <div className="lg:col-span-7 space-y-8">
                <div className="divide-y divide-[#ded8ca]/80 border-t border-b border-[#ded8ca]/80">
                  {cart.map((item) => (
                    <div key={item.id} className="py-6 flex items-center justify-between gap-4">
                      {/* Left Item Details */}
                      <div className="flex items-center gap-5">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#ded8ca] bg-white">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover object-center"
                          />
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-serif text-lg font-normal text-[#243126]">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[#6a6861]">{item.size}</p>
                          <p className="text-xs font-semibold text-[#243126] pt-0.5">
                            ₹{item.price.toLocaleString("en-IN")}
                          </p>

                          {/* Quantity Selector */}
                          <div className="pt-2">
                            <div className="inline-flex items-center gap-4 rounded-full border border-[#ded8ca] bg-white px-3 py-1 text-xs text-[#243126]">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="text-[#77756c] hover:text-[#243126] transition cursor-pointer"
                              >
                                <Minus size={13} strokeWidth={2} />
                              </button>
                              <span className="font-medium min-w-[12px] text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="text-[#77756c] hover:text-[#243126] transition cursor-pointer"
                              >
                                <Plus size={13} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Item Actions & Price */}
                      <div className="flex flex-col items-end justify-between h-20 py-1">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="Remove item"
                          className="text-[#77756c] hover:text-red-600 transition cursor-pointer"
                        >
                          <Trash2 size={16} strokeWidth={1.7} />
                        </button>

                        <span className="font-semibold text-sm text-[#243126]">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Cart Action Buttons */}
                <div className="flex items-center gap-6 pt-2">
                  <Link
                    href="/shop"
                    className="rounded-xl border border-[#ded8ca] bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#f3efe6] transition cursor-pointer"
                  >
                    Continue Shopping
                  </Link>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs sm:text-sm font-medium text-[#243126] hover:text-red-600 transition cursor-pointer underline underline-offset-4"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Right Column: Order Summary Card */}
              <div className="lg:col-span-5">
                <div className="rounded-[24px] border border-[#e8e2d4] bg-white p-6 sm:p-8 shadow-xs space-y-6">
                  <h2 className="font-serif text-2xl font-normal text-[#243126]">
                    Order Summary
                  </h2>

                  <div className="space-y-3.5 text-xs sm:text-sm">
                    <div className="flex justify-between text-[#6a6861]">
                      <span>Items</span>
                      <span className="font-medium text-[#243126]">{totalCount}</span>
                    </div>

                    <div className="flex justify-between text-[#6a6861]">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[#243126]">
                        ₹{subtotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#6a6861]">
                      <span>Shipping</span>
                      <span className="font-medium text-[#285538]">Free</span>
                    </div>

                    <div className="border-t border-[#ded8ca] pt-3.5 flex justify-between font-bold text-base text-[#243126]">
                      <span>Total</span>
                      <span>₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Link
                      href="/checkout"
                      className="block w-full text-center rounded-xl bg-[#285538] py-3.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition cursor-pointer"
                    >
                      Proceed to Checkout
                    </Link>
                    <p className="text-[11px] text-center text-[#77756c] pt-1">
                      Taxes calculated at checkout.
                    </p>
                  </div>
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