"use client";

import { LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [remember, setRemember] = useState(true);
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.cookie = `nexobd-admin-session=active; path=/${remember ? "; max-age=86400" : ""}`;
    router.push("/admin/dashboard");
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#183c26] px-4"><section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9"><div className="flex items-center gap-2.5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00843d] text-xl font-black text-white">N</span><span className="text-2xl font-black tracking-[-0.07em] text-[#183c26]">Nexo<span className="text-[#ff6b00]">BD</span></span></div><p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">NexoBD operations</p><h1 className="mt-2 text-3xl font-black text-[#183c26]">Admin sign in</h1><form onSubmit={handleSubmit} className="mt-7 space-y-4"><label className="block text-sm font-bold text-[#31513a]">Email<div className="mt-2 flex items-center gap-2 rounded-lg border border-[#dce8dc] px-3 py-3"><Mail className="h-4 w-4 text-[#70917a]" /><input type="email" placeholder="admin@nexobd.com" className="w-full outline-none" required /></div></label><label className="block text-sm font-bold text-[#31513a]">Password<div className="mt-2 flex items-center gap-2 rounded-lg border border-[#dce8dc] px-3 py-3"><LockKeyhole className="h-4 w-4 text-[#70917a]" /><input type="password" placeholder="Password" className="w-full outline-none" required /></div></label><label className="flex items-center gap-2 text-sm text-[#52715a]"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="accent-[#00843d]" /> Remember me</label><button className="w-full rounded-lg bg-[#ff6b00] px-5 py-3 text-sm font-bold text-white hover:bg-[#e85c00]">Login to dashboard</button></form></section></main>;
}
