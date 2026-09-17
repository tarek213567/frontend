"use client";

import {
  ChevronDown,
  Heart,
  Languages,
  LogIn,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const categories = ["Groceries", "Fashion", "Beauty", "Electronics", "Home & Living"];

export default function Header() {
  const { itemCount } = useCart();
  return (
    <header className="border-b border-[#e9efe9] bg-white">
      <div className="bg-[#f3f8f3] text-xs text-[#54705b]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden sm:inline">Free delivery over ৳1,000</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#00843d]" /> Cash on delivery available</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="hidden sm:inline">Support</span>
            <span>Track order</span>
            <span className="flex items-center gap-1"><Languages className="h-3.5 w-3.5" /> EN <ChevronDown className="h-3 w-3" /></span>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:flex-nowrap lg:px-8">
        <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="NexoBD home">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00843d] text-2xl font-black text-white shadow-[0_5px_15px_rgba(0,132,61,0.2)]">N</span>
          <span className="text-[2rem] font-black tracking-[-0.07em] text-[#123c25]">Nexo<span className="text-[#ff6b00]">BD</span></span>
        </a>
        <div className="order-3 flex w-full items-center gap-2 rounded-xl border border-[#dce8dc] bg-[#f8fbf8] px-4 py-3 lg:order-none lg:ml-5 lg:flex-1">
          <Search className="h-5 w-5 shrink-0 text-[#6e8875]" />
          <input className="w-full bg-transparent text-sm text-[#183c26] outline-none placeholder:text-[#8ca191]" placeholder="Search for products, brands and more" aria-label="Search products" />
          <button className="hidden shrink-0 items-center gap-1 border-l border-[#dce8dc] pl-4 text-xs font-semibold text-[#52715a] sm:flex">All categories <ChevronDown className="h-3.5 w-3.5" /></button>
          <button className="hidden rounded-lg bg-[#ff6b00] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#e85c00] sm:block">Search</button>
        </div>
        <div className="ml-auto flex items-center gap-4 text-[#183c26]">
          <button className="hidden items-center gap-2 text-sm font-semibold xl:flex"><MapPin className="h-5 w-5 text-[#00843d]" /> Dhaka <ChevronDown className="h-4 w-4" /></button>
          <button aria-label="Favorites" className="hidden sm:block"><Heart className="h-5 w-5" /></button>
          <button className="hidden items-center gap-2 rounded-lg border border-[#dce8dc] px-3 py-2 text-xs font-bold sm:flex"><LogIn className="h-4 w-4" /> Login / Register</button>
          <button aria-label="Account" className="sm:hidden"><UserRound className="h-5 w-5" /></button>
          <Link href="/cart" aria-label="Shopping bag" className="relative"><ShoppingBag className="h-6 w-6" />{itemCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff6b00] text-[10px] font-bold text-white">{itemCount}</span>}</Link>
          <button aria-label="Open menu" className="lg:hidden"><Menu className="h-6 w-6" /></button>
        </div>
      </div>
      <nav className="mx-auto hidden max-w-[1240px] items-center gap-7 px-4 pb-4 text-sm font-semibold text-[#31513a] sm:px-6 lg:flex lg:px-8">
        <a className="flex items-center gap-2 text-[#00843d]" href="#categories"><Menu className="h-4 w-4" /> All categories</a>
        {categories.map((category) => <a href="#categories" key={category} className="transition hover:text-[#00843d]">{category}</a>)}
        <a className="ml-auto flex items-center gap-2 text-[#ff6b00]" href="#deals"><span className="h-2 w-2 animate-pulse rounded-full bg-[#ff6b00]" /> Hot deals</a>
      </nav>
    </header>
  );
}