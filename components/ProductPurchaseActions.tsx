"use client";

import { Check, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

export default function ProductPurchaseActions({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  function handleAddToCart() {
    for (let index = 0; index < quantity; index += 1) addToCart(product);
    setMessage(`${product.name} added to your cart.`);
  }

  return <><div className="mt-6 flex flex-wrap gap-3"><div className="flex items-center rounded-lg border border-[#dce8dc]"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="p-3"><Minus className="h-4 w-4" /></button><span className="w-8 text-center text-sm font-bold">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))} className="p-3"><Plus className="h-4 w-4" /></button></div><button type="button" onClick={handleAddToCart} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#00843d] px-5 py-3 text-sm font-bold text-[#00843d] hover:bg-[#edf8ef]"><ShoppingCart className="h-4 w-4" /> Add to cart</button><button type="button" onClick={handleAddToCart} className="flex-1 rounded-lg bg-[#00843d] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#00843d]/20 hover:bg-[#006f33]">Buy now</button><button type="button" aria-label="Add to wishlist" className="rounded-lg border border-[#dce8dc] p-3 text-[#52715a] hover:text-[#ff6b00]"><Heart className="h-5 w-5" /></button></div>{message && <p role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#00843d]"><Check className="h-4 w-4" /> {message}</p>}<div className="mt-6 flex items-center gap-2 text-xs text-[#66806b]"><Check className="h-4 w-4 text-[#00843d]" /> {product.stock} units available · Verified NexoBD seller</div></>;
}
