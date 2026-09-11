import { Leaf, Sparkles, Droplets, Recycle } from "lucide-react";

export function TrustValues() {
  return (
    <section className="bg-background py-12">
      <div className="mx-auto max-w-7xl px-6">
        {/* Mobile par grid-cols-2 aur desktop par lg:grid-cols-4 kiya hai */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage mb-4">
              <Leaf size={20} strokeWidth={1.7} className="text-forest" />
            </div>
            <h3 className="font-serif text-base font-semibold text-foreground">
              Clean Ingredients
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Sourced with care, nothing unnecessary
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage mb-4">
              <Sparkles size={20} strokeWidth={1.7} className="text-forest" />
            </div>
            <h3 className="font-serif text-base font-semibold text-foreground">
              Thoughtful Formulations
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Classical recipes, modern batches
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage mb-4">
              <Droplets size={20} strokeWidth={1.7} className="text-forest" />
            </div>
            <h3 className="font-serif text-base font-semibold text-foreground">
              Gentle Daily Care
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Made for consistent, easy routines
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage mb-4">
              <Recycle size={20} strokeWidth={1.7} className="text-forest" />
            </div>
            <h3 className="font-serif text-base font-semibold text-foreground">
              Sustainable Packaging
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Easily recyclable cartons and jars
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}