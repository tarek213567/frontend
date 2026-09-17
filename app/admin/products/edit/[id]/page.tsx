import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AdminProductForm from "@/components/AdminProductForm";
import AdminShell from "@/components/AdminShell";
import { getProductById } from "@/services/productService";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return <main className="p-10">Product not found.</main>;
  return <AdminShell title="Edit product"><div className="mx-auto max-w-3xl"><Link href="/admin/products" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-[#52715a]"><ArrowLeft className="h-3.5 w-3.5" /> Back to products</Link><section className="rounded-2xl border border-[#e3ece4] bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">Catalog workspace</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Edit product</h2><AdminProductForm product={product} /></section></div></AdminShell>;
}
