import { ArrowRight, BadgePercent, ShieldCheck } from "lucide-react";

export default function HeroBanner() {
  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#dcefe0] shadow-[0_14px_40px_rgba(29,87,43,0.13)]">
      <div className="absolute inset-0 -z-10 bg-cover bg-center opacity-75" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1601598851547-4302969d8a79?auto=format&fit=crop&w=1600&q=85)" }} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#dcefe0] via-[#dcefe0]/95 to-[#dcefe0]/10" />
      <div className="relative grid min-h-[370px] items-center px-7 py-12 sm:px-12 lg:min-h-[430px] lg:grid-cols-2 lg:px-16">
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-[#ff6b00] shadow-sm"><BadgePercent className="h-4 w-4" /> NexoBD mega offers</div>
          <h1 className="max-w-lg text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#123c25] sm:text-6xl">Latest electronics <span className="text-[#00843d]">collection.</span></h1>
          <p className="mt-4 text-2xl font-black text-[#ff6b00] sm:text-3xl">Up to 50% OFF</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#52715a] sm:text-base">Smart upgrades, honest prices, and fast delivery from Bangladesh&apos;s trusted sellers.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3"><a href="#deals" className="flex items-center gap-2 rounded-lg bg-[#00843d] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#00843d]/20 transition hover:bg-[#006f33]">Shop now <ArrowRight className="h-4 w-4" /></a><span className="flex items-center gap-2 px-2 text-xs font-bold text-[#31513a]"><ShieldCheck className="h-4 w-4 text-[#00843d]" /> Best price guaranteed</span></div>
        </div>
      </div>
      <div className="absolute bottom-5 right-8 hidden items-center gap-2 text-xs font-bold text-[#52715a] lg:flex"><span className="h-1.5 w-8 rounded-full bg-[#00843d]" /><span className="h-1.5 w-2 rounded-full bg-[#9cbea5]" /><span className="h-1.5 w-2 rounded-full bg-[#9cbea5]" /></div>
    </section>
  );
}