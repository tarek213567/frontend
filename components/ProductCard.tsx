"use client";

import { Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
const formatPrice = (price: number) => `৳ ${price.toLocaleString("en-BD")}`;

export default function ProductCard({ id, name, brand, price, oldPrice, discount, rating, image, stock, ...product }: Product) {
  const { addToCart } = useCart();
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#e8eee8] bg-white shadow-[0_5px_20px_rgba(25,78,40,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(25,78,40,0.13)]">
      <div className="relative m-2 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#f5f8f4]">
        <Link href={`/products/${id}`} className="absolute inset-0"><Image src={image} alt={name} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px" className="object-cover transition duration-500 group-hover:scale-105" /></Link>
        <span className="absolute left-3 top-3 rounded-md bg-[#ff6b00] px-2 py-1 text-[11px] font-bold text-white">-{discount}%</span>
        <button aria-label={`Save ${name}`} className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-[#52715a] shadow-sm transition hover:text-[#ff6b00]"><Heart className="h-4 w-4" /></button>
      </div>
      <div className="p-4 pt-2">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a9d8d]">{brand}</p>
        <h3 className="min-h-11 text-sm font-bold leading-5 text-[#183c26]"><Link href={`/products/${id}`} className="hover:text-[#00843d]">{name}</Link></h3>
        <div className="mt-2 flex items-center gap-1 text-xs text-[#e8a100]"><Star className="h-3.5 w-3.5 fill-current" /> {rating.toFixed(1)} <span className="text-[#a1afa3]">({stock} left)</span></div>
        <div className="mt-3 flex items-end gap-2"><span className="text-lg font-black text-[#00843d]">{formatPrice(price)}</span><span className="text-xs text-[#9aaa9c] line-through">{formatPrice(oldPrice)}</span></div>
        <button onClick={() => addToCart({ id, name, brand, price, oldPrice, discount, rating, image, stock, ...product })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#b9d9bf] py-2.5 text-xs font-bold text-[#00843d] transition hover:bg-[#00843d] hover:text-white"><ShoppingCart className="h-4 w-4" /> Add to cart</button>
      </div>
    </article>
  );
}