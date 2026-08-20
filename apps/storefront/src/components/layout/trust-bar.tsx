import { Flower2, Leaf, Rabbit, Sun } from "lucide-react";

const trustItems = [
  { label: "Clean Ingredients", icon: Leaf },
  { label: "Ayurveda Inspired", icon: Flower2 },
  { label: "Cruelty Free", icon: Rabbit },
  { label: "Made for Everyday Wellness", icon: Sun },
];

export function TrustBar() {
  return (
    <div className="border-b border-[#ded8ca] bg-[#f3efe6] px-4 py-2">
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-2">
        {trustItems.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#38553d]"
          >
            <Icon size={15} strokeWidth={1.7} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}