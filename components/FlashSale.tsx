"use client";

import { ArrowRight, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";

const initialSeconds = 8 * 60 * 60 + 42 * 60 + 16;

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

export default function FlashSale({ products }: { products: Product[] }) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [hours, minutes, seconds] = formatTime(remaining);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((current) => current > 0 ? current - 1 : initialSeconds), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <section id="deals" className="bg-[#f7faf7]"><div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8"><div className="mb-7 flex items-end justify-between"><div><div className="mb-2 flex items-center gap-2 text-[#ff6b00]"><Clock3 className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-[0.18em]">Limited time only</span></div><h2 className="text-2xl font-black tracking-[-0.04em] text-[#ff6b00] sm:text-3xl">Flash Sale</h2></div><div className="flex items-center gap-2 text-xs font-bold text-[#66806b]"><span className="hidden sm:inline">Ends in</span><span className="rounded bg-[#183c26] px-2 py-1 text-white">{hours}</span><b>:</b><span className="rounded bg-[#183c26] px-2 py-1 text-white">{minutes}</span><b>:</b><span className="rounded bg-[#183c26] px-2 py-1 text-white">{seconds}</span></div></div><div id="products" className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-5">{products.slice(0, 5).map((product) => <ProductCard key={product.id} {...product} />)}</div><a href="#products" className="mx-auto mt-7 flex w-fit items-center gap-1 text-sm font-bold text-[#00843d]">View all deals <ArrowRight className="h-4 w-4" /></a></div></section>;
}