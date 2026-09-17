import { ChevronRight, Laptop, Smartphone, Sparkles, WashingMachine, Shirt, ShoppingBasket, Baby, Gamepad2 } from "lucide-react";

const items = [
  ["Mobile & Tablets", Smartphone], ["Laptop & Computer", Laptop], ["Electronics", Sparkles], ["Home Appliances", WashingMachine], ["Fashion", Shirt], ["Beauty", Sparkles], ["Grocery", ShoppingBasket], ["Baby Products", Baby], ["Gaming", Gamepad2],
] as const;

export default function CategoryMenu() {
  return <nav aria-label="Product categories">{items.map(([name, Icon], index) => <a key={name} href="#products" className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-[#edf8ef] ${index === 2 ? "bg-[#edf8ef] font-bold text-[#00843d]" : "text-[#46604c]"}`}><Icon className="h-[18px] w-[18px] shrink-0 text-[#70917a] group-hover:text-[#00843d]" /><span className="flex-1">{name}</span><ChevronRight className="h-3.5 w-3.5 text-[#a7b8aa]" /></a>)}</nav>;
}