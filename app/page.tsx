import { ArrowRight, Headphones, ShieldCheck, Truck } from "lucide-react";
import CategoryCard from "@/components/CategoryCard";
import CategorySidebar from "@/components/CategorySidebar";
import Footer from "@/components/Footer";
import FlashSale from "@/components/FlashSale";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import ProductSection from "@/components/ProductSection";
import type { Product } from "@/data/products";
import { getProducts } from "@/services/productService";

const categories = [
  { name: "Fresh groceries", count: "240+", accent: "#e8f6e9", image: "/products/grocery.svg" },
  { name: "Fashion", count: "180+", accent: "#fff0e8", image: "/products/fashion.svg" },
  { name: "Beauty care", count: "95+", accent: "#fff5d9", image: "/products/beauty.svg" },
  { name: "Electronics", count: "320+", accent: "#e9f2f7", image: "/products/electronics.svg" },
  { name: "Home living", count: "140+", accent: "#f2edfa", image: "/products/home.svg" },
];

const services = [
  { icon: Truck, title: "Fast delivery", detail: "Across Dhaka in 24 hours" },
  { icon: ShieldCheck, title: "Verified sellers", detail: "Shop with complete confidence" },
  { icon: Headphones, title: "Always here to help", detail: "Friendly support, 7 days a week" },
];

function ProductShelf({ title, eyebrow, products }: { title: string; eyebrow: string; products: Product[] }) {
  return <ProductSection title={title} eyebrow={eyebrow} products={products} />;
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  const flashSale = products.filter((product) => product.discount >= 15).slice(0, 5);
  const popularProducts = [...products].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const newArrivals = products.slice(0, 5);
  const bestSelling = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 5);
  return <div id="top" className="min-h-screen bg-white text-[#183c26]"><Header /><main>
    <div className="mx-auto flex max-w-[1240px] gap-5 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-7"><CategorySidebar /><div className="min-w-0 flex-1"><HeroBanner /></div></div>
    <section className="border-b border-[#edf2ed] bg-white"><div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:px-8">{services.map(({ icon: Icon, title, detail }) => <div key={title} className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf8ef] text-[#00843d]"><Icon className="h-5 w-5" /></span><div><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-xs text-[#77907d]">{detail}</p></div></div>)}</div></section>
    <section id="categories" className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8"><div className="mb-6 flex items-end justify-between"><div><p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">Browse and discover</p><h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">Shop by category</h2></div><a href="#products" className="hidden items-center gap-1 text-sm font-bold text-[#00843d] sm:flex">View all <ArrowRight className="h-4 w-4" /></a></div><div className="flex gap-3 overflow-x-auto pb-2 sm:gap-4 lg:gap-5">{categories.map((category) => <CategoryCard key={category.name} {...category} />)}</div></section>
    <FlashSale products={flashSale.length ? flashSale : products.slice(0, 5)} />
    <ProductShelf title="Popular products" eyebrow="Loved by shoppers" products={popularProducts} />
    <section className="mx-auto grid max-w-[1240px] gap-4 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8"><div className="relative min-h-[190px] overflow-hidden rounded-2xl bg-[#ffeadf] p-7"><div className="relative z-10 max-w-[230px]"><p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff6b00]">New season</p><h2 className="mt-2 text-2xl font-black leading-tight text-[#6c2b14]">Style that feels like you</h2><a href="#categories" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#ff6b00]">Explore fashion <ArrowRight className="h-4 w-4" /></a></div><div className="absolute right-0 top-0 h-full w-1/2 bg-cover bg-center" style={{ backgroundImage: "url(/products/fashion.svg)" }} /></div><div className="relative min-h-[190px] overflow-hidden rounded-2xl bg-[#e4f1e9] p-7"><div className="relative z-10 max-w-[230px]"><p className="text-xs font-black uppercase tracking-[0.15em] text-[#00843d]">NexoBD essentials</p><h2 className="mt-2 text-2xl font-black leading-tight text-[#123c25]">Better basics, better days</h2><a href="#deals" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#00843d]">Shop essentials <ArrowRight className="h-4 w-4" /></a></div><div className="absolute right-0 top-0 h-full w-1/2 bg-cover bg-center" style={{ backgroundImage: "url(/products/home.svg)" }} /></div></section>
    <ProductShelf title="New arrivals" eyebrow="Just landed on NexoBD" products={newArrivals} />
    <ProductShelf title="Best selling products" eyebrow="What Bangladesh is buying" products={bestSelling} />
  </main><Footer /></div>;
}
