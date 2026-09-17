import { ArrowLeft, Star, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductPurchaseActions from "@/components/ProductPurchaseActions";
import { products, type Product } from "@/data/products";
import { getProductById, getProducts } from "@/services/productService";

const formatPrice = (price: number) => `৳ ${price.toLocaleString("en-BD")}`;

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

function RelatedProducts({ product, products: catalog }: { product: Product; products: Product[] }) {
  const related = catalog.filter((candidate) => candidate.category === product.category && candidate.id !== product.id).slice(0, 4);
  return <section className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8"><div className="mb-7 flex items-end justify-between"><div><p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">You may also like</p><h2 className="text-2xl font-black tracking-[-0.04em]">Related products</h2></div><Link href="/#products" className="flex items-center gap-1 text-sm font-bold text-[#00843d]">View all <ArrowLeft className="h-4 w-4 rotate-180" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{related.map((item) => <ProductCard key={item.id} {...item} />)}</div></section>;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  const catalog = await getProducts();

  return <div className="min-h-screen bg-white text-[#183c26]"><Header /><main><div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8"><Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#52715a] hover:text-[#00843d]"><ArrowLeft className="h-4 w-4" /> Back to shopping</Link><div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14"><div className="relative aspect-square overflow-hidden rounded-3xl bg-[#f5f8f4] shadow-[0_12px_35px_rgba(25,78,40,0.08)]"><Image src={product.image} alt={product.name} fill priority sizes="(max-width: 1024px) 90vw, 520px" className="object-cover" /><span className="absolute left-5 top-5 rounded-lg bg-[#ff6b00] px-3 py-2 text-sm font-black text-white">-{product.discount}% OFF</span></div><div className="flex flex-col justify-center"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">{product.category}</p><p className="mt-3 text-sm font-bold text-[#77907d]">{product.brand}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#123c25] sm:text-4xl">{product.name}</h1><div className="mt-4 flex items-center gap-2 text-sm text-[#e8a100]"><Star className="h-4 w-4 fill-current" /><span className="font-bold">{product.rating.toFixed(1)}</span><span className="text-[#8ba18e]">({product.reviews} reviews)</span></div><div className="mt-6 flex items-end gap-3"><span className="text-3xl font-black text-[#00843d]">{formatPrice(product.price)}</span><span className="text-base text-[#9aaa9c] line-through">{formatPrice(product.oldPrice)}</span></div><p className="mt-6 max-w-xl leading-7 text-[#5c7663]">{product.description}</p><div className="mt-6 flex items-center gap-3 rounded-xl bg-[#f5faf5] px-4 py-3 text-sm font-semibold text-[#31513a]"><Truck className="h-5 w-5 text-[#00843d]" /> Free delivery on orders over ৳1,000</div><ProductPurchaseActions product={product} /></div></div></div><section className="mx-auto mt-12 max-w-[1240px] border-t border-[#edf2ed] px-4 pt-10 sm:px-0"><h2 className="text-xl font-black">Specifications</h2><div className="mt-5 grid max-w-2xl gap-3 sm:grid-cols-3">{product.specifications.map((specification) => <div key={specification.label} className="rounded-xl bg-[#f7faf7] p-4"><p className="text-xs text-[#77907d]">{specification.label}</p><p className="mt-1 text-sm font-bold text-[#31513a]">{specification.value}</p></div>)}</div></section><RelatedProducts product={product} products={catalog} /></main><Footer /></div>;
}
