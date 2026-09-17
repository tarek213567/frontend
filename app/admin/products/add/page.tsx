import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AdminProductForm from "@/components/AdminProductForm";
import AdminShell from "@/components/AdminShell";

export default function AddProductPage() {
  return <AdminShell title="Add product"><div className="mx-auto max-w-3xl"><Link href="/admin/products" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-[#52715a]"><ArrowLeft className="h-3.5 w-3.5" /> Back to products</Link><section className="rounded-2xl border border-[#e3ece4] bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">Catalog workspace</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Add product</h2><p className="mt-2 text-sm text-[#77907d]">This form writes to Supabase when your environment is configured.</p><AdminProductForm /></section></div></AdminShell>;
}
