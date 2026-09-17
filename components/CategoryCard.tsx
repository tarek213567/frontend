type CategoryCardProps = { name: string; count: string; image: string; accent: string };

export default function CategoryCard({ name, count, image, accent }: CategoryCardProps) {
  return (
    <a href="#products" className="group flex min-w-[136px] flex-1 flex-col items-center rounded-2xl p-3 text-center transition hover:-translate-y-1" style={{ backgroundColor: accent }}>
      <div className="mb-3 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-sm"><div className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${image})` }} /></div>
      <h3 className="text-sm font-bold text-[#183c26]">{name}</h3>
      <p className="mt-1 text-xs text-[#66806b]">{count} items</p>
    </a>
  );
}