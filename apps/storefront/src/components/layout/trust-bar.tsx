import { Flower2, Leaf, Rabbit, Sun } from "lucide-react";

const trustItems = [
  { label: "Clean Ingredients", icon: Leaf },
  { label: "Ayurveda Inspired", icon: Flower2 },
  { label: "Cruelty Free", icon: Rabbit },
  { label: "Made for Everyday Wellness", icon: Sun },
];

export function TrustBar() {
  return (
    <div className="border-b border-[#ded8ca] bg-[#f3efe6] px-2 sm:px-4 py-2">
      {/* Mobile aur desktop dono par overall center alignment aur tight gap */}
      <div className="flex items-center justify-center gap-x-3 sm:gap-x-6 lg:gap-x-12">
        {trustItems.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 lg:gap-2 text-[8px] sm:text-[10px] font-medium uppercase tracking-[0.1em] lg:tracking-[0.18em] text-[#38553d]"
          >
            <Icon size={13} strokeWidth={1.7} className="shrink-0 lg:w-[15px]" />
            <span className="leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}