import { Truck, RotateCcw, ShieldCheck } from "lucide-react";

export function ShoppingBenefits() {
  return (
    <section className="bg-forest py-8">
      <div className="mx-auto max-w-7xl px-6">
        {/* Mobile par justify-center, desktop par sm:justify-center */}
        <div className="flex flex-col sm:flex-row text-white divide-y sm:divide-y-0 divide-[rgba(255,255,255,0.08)] sm:divide-x">
          <div className="flex flex-1 items-center justify-center py-4 sm:py-0 px-0 sm:px-6">
            <Truck size={22} strokeWidth={1.7} className="mr-3 shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-semibold">Free Shipping</h3>
              <p className="mt-0.5 text-[13px]">On all orders above Rs. 999</p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-4 sm:py-0 px-0 sm:px-6 sm:border-l sm:border-[rgba(255,255,255,0.08)]">
            <RotateCcw size={22} strokeWidth={1.7} className="mr-3 shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-semibold">Easy Returns</h3>
              <p className="mt-0.5 text-[13px]">15 days on unopened packs</p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-4 sm:py-0 px-0 sm:px-6 sm:border-l sm:border-[rgba(255,255,255,0.08)]">
            <ShieldCheck size={22} strokeWidth={1.7} className="mr-3 shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-semibold">Secure Checkout</h3>
              <p className="mt-0.5 text-[13px]">Protected payments, always</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}