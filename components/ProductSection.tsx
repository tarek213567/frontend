import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";

type ProductSectionProps = {
  title: string;
  eyebrow: string;
  products: Product[];
};

export default function ProductSection({ title, eyebrow, products }: ProductSectionProps) {
  return <section className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8"><div className="mb-7 flex items-end justify-between"><div><p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">{eyebrow}</p><h2 className="text-2xl font-black tracking-[-0.04em] text-[#183c26] sm:text-3xl">{title}</h2></div><a href="#categories" className="hidden items-center gap-1 text-sm font-bold text-[#00843d] sm:flex">View all <ArrowRight className="h-4 w-4" /></a></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">{products.map((product) => <ProductCard key={product.id} {...product} />)}</div></section>;
}