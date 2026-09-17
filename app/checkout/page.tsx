"use client";

import { ArrowLeft, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { createOrder } from "@/services/orderService";

const formatPrice = (price: number) => `৳ ${price.toLocaleString("en-BD")}`;
const deliveryCharge = 60;

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const delivery = subtotal === 0 || subtotal >= 1000 ? 0 : deliveryCharge;
  const total = subtotal + delivery;
  const [status, setStatus] = useState("");
  const [orderId, setOrderId] = useState("");

  async function submitOrder(formData: FormData) {
    setStatus("Placing your order...");
    try {
      const order = await createOrder({ customer_name: String(formData.get("name")), phone: String(formData.get("phone")), address: `${String(formData.get("address"))}, ${String(formData.get("city"))}`, products: items.map(({ product, quantity }) => ({ id: product.id, name: product.name, quantity, price: product.price })), total_amount: total, payment_method: String(formData.get("payment")) as "cod" | "bkash" | "nagad" });
      setOrderId(order.id);
      setStatus("Order placed successfully.");
      clearCart();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to place order.");
    }
  }

  return <div className="min-h-screen bg-[#f7faf7] text-[#183c26]"><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><Link href="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-[#52715a]"><ArrowLeft className="h-4 w-4" /> Back to cart</Link>{orderId ? <section className="mx-auto mt-12 max-w-lg rounded-2xl border border-[#b9d9bf] bg-white p-8 text-center shadow-sm"><ShieldCheck className="mx-auto h-12 w-12 text-[#00843d]" /><h1 className="mt-4 text-2xl font-black">Order confirmed</h1><p className="mt-2 text-sm text-[#77907d]">Your order has been sent to the NexoBD fulfillment team.</p><p className="mt-4 rounded-lg bg-[#edf8ef] px-4 py-3 text-sm font-bold text-[#00843d]">Order ID: {orderId}</p><Link href="/" className="mt-6 inline-flex rounded-lg bg-[#00843d] px-5 py-3 text-sm font-bold text-white">Continue shopping</Link></section> : <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"><section className="rounded-2xl border border-[#e3ece4] bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">Secure checkout</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Delivery details</h1><form action={submitOrder} className="mt-8 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold">Customer name<input name="name" required className="mt-2 w-full rounded-lg border border-[#dce8dc] px-3 py-3 outline-none focus:border-[#00843d]" placeholder="Your full name" /></label><label className="text-sm font-bold">Phone number<input name="phone" type="tel" required className="mt-2 w-full rounded-lg border border-[#dce8dc] px-3 py-3 outline-none focus:border-[#00843d]" placeholder="01XXXXXXXXX" /></label></div><label className="block text-sm font-bold">Email<input name="email" type="email" required className="mt-2 w-full rounded-lg border border-[#dce8dc] px-3 py-3 outline-none focus:border-[#00843d]" placeholder="you@example.com" /></label><label className="block text-sm font-bold">Full address<textarea name="address" required className="mt-2 min-h-24 w-full rounded-lg border border-[#dce8dc] px-3 py-3 outline-none focus:border-[#00843d]" placeholder="House, road, area" /></label><label className="block text-sm font-bold">City<input name="city" required className="mt-2 w-full rounded-lg border border-[#dce8dc] px-3 py-3 outline-none focus:border-[#00843d]" placeholder="Dhaka" /></label><fieldset><legend className="text-sm font-bold">Payment method</legend><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#b9d9bf] bg-[#edf8ef] p-3 text-sm font-semibold"><input type="radio" name="payment" value="cod" defaultChecked /> Cash on Delivery</label><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#dce8dc] p-3 text-sm font-semibold"><input type="radio" name="payment" value="bkash" /> bKash</label><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#dce8dc] p-3 text-sm font-semibold"><input type="radio" name="payment" value="nagad" /> Nagad</label></div></fieldset><button disabled={items.length === 0} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00843d] px-5 py-3 text-sm font-bold text-white hover:bg-[#006f33] disabled:cursor-not-allowed disabled:opacity-50"><CreditCard className="h-4 w-4" /> Place order</button>{status && <p role="status" className="text-sm font-semibold text-[#c45b35]">{status}</p>}</form></section><aside className="h-fit rounded-2xl border border-[#e3ece4] bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Order summary</h2><div className="mt-5 space-y-4">{items.map(({ product, quantity }) => <div key={product.id} className="flex justify-between gap-4 text-sm"><span className="text-[#52715a]">{product.name} × {quantity}</span><span className="font-bold">{formatPrice(product.price * quantity)}</span></div>)}</div><div className="my-5 border-t border-[#edf2ed]" /><div className="flex justify-between text-sm text-[#66806b]"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="mt-3 flex justify-between text-sm text-[#66806b]"><span>Delivery</span><span>{delivery ? formatPrice(delivery) : "Free"}</span></div><div className="my-5 border-t border-[#edf2ed]" /><div className="flex justify-between"><span className="font-bold">Total</span><span className="text-xl font-black text-[#00843d]">{formatPrice(total)}</span></div><p className="mt-5 flex items-center gap-2 text-xs text-[#77907d]"><MapPin className="h-4 w-4 text-[#00843d]" /> Delivery across Bangladesh</p></aside></div>}</main></div>;
}
