"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, X, Trash2, Plus, Minus } from "lucide-react";

import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";

export function CartDrawer() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalCount,
  } = useCart();

  const handleProceedToCheckout = () => {
    closeCart();
    if (isLoggedIn) {
      router.push("/checkout");
    } else {
      router.push("/login?redirect=/checkout");
    }
  };

  return (
    <>
      {/* Dark Overlay Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-brightness-45 transition-all duration-300 ${
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Slide-in Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#fbf9f3] text-foreground shadow-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-5">
          <h2 className="font-serif text-2xl font-normal text-foreground">
            Your Cart {cart.length > 0 && <span className="text-lg text-muted-foreground">({totalCount})</span>}
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 hover:bg-secondary/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-border/40">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e2ebe4] text-forest mb-5">
                <ShoppingBag size={28} strokeWidth={2.2} />
              </div>

              <h3 className="font-serif text-xl font-normal text-foreground">
                Your cart is empty
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                Explore our herbal collections and add something to begin.
              </p>

              <Link
                href="/shop"
                onClick={closeCart}
                className="mt-6 inline-block rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-forest-foreground hover:opacity-90 transition cursor-pointer"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="py-5 flex gap-4 items-start">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-white">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-center"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-[15px] font-normal leading-snug text-foreground">
                      {item.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-muted-foreground hover:text-red-600 transition cursor-pointer pt-0.5"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} strokeWidth={1.7} />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">{item.size}</p>

                  <div className="flex items-center justify-between pt-2.5">
                    <div className="inline-flex items-center gap-3.5 rounded-full border border-border/70 bg-background/50 px-3 py-1 text-xs text-foreground">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                      >
                        <Minus size={13} strokeWidth={2} />
                      </button>
                      <span className="font-medium min-w-[12px] text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                      >
                        <Plus size={13} strokeWidth={2} />
                      </button>
                    </div>

                    <span className="font-semibold text-sm text-foreground">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="border-t border-border/40 bg-[#fbf9f3] px-6 py-5 space-y-4">
            <div className="flex items-center justify-between text-foreground">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-lg">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Shipping and taxes are calculated at checkout.
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="block w-full text-center rounded-xl bg-forest py-3.5 text-xs sm:text-sm font-semibold text-forest-foreground hover:opacity-90 transition cursor-pointer"
              >
                Proceed to Checkout
              </button>

              <Link
                href="/cart"
                onClick={closeCart}
                className="block w-full text-center rounded-xl border border-border/80 bg-transparent py-3 text-xs sm:text-sm font-medium text-foreground hover:bg-white/60 transition cursor-pointer"
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}