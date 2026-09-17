create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null,
  brand text not null,
  description text not null default '',
  price numeric(12, 2) not null default 0,
  old_price numeric(12, 2) not null default 0,
  discount numeric(5, 2) not null default 0,
  image_url text not null default '',
  stock integer not null default 0,
  rating numeric(3, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_created_at_idx on public.products(created_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  products jsonb not null default '[]'::jsonb,
  total_amount numeric(12, 2) not null default 0,
  payment_method text not null,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;