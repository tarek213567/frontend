import { ChevronRight } from "lucide-react";
import CategoryMenu from "@/components/CategoryMenu";

export default function CategorySidebar() {
  return (
    <aside className="hidden w-[238px] shrink-0 rounded-2xl border border-[#e3ece4] bg-white p-3 shadow-[0_8px_30px_rgba(23,72,37,0.06)] lg:block">
      <div className="mb-2 flex items-center justify-between border-b border-[#edf2ed] px-3 pb-3"><h2 className="text-sm font-black text-[#183c26]">Shop by category</h2><span className="rounded bg-[#edf8ef] px-2 py-1 text-[10px] font-bold text-[#00843d]">9 groups</span></div>
      <CategoryMenu />
      <a href="#categories" className="mt-2 flex items-center justify-center gap-1 rounded-xl bg-[#fff5ed] px-3 py-3 text-xs font-bold text-[#ff6b00]">View all categories <ChevronRight className="h-3.5 w-3.5" /></a>
    </aside>
  );
}
