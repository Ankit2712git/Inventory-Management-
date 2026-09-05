-- =============================================================================
-- Bangla Haat — Supabase Row Level Security (RLS) & Schema Setup
-- Run this script in your Supabase Project -> SQL Editor to secure your database.
-- =============================================================================

-- 1. Create Products Table (if not exists)
create table if not exists public.products (
  id text primary key,
  name text not null,
  product_code text not null unique,
  category text not null,
  description text,
  expiry_date text,
  price numeric not null default 0,
  stock_quantity integer not null default 0,
  image_url text,
  discount_percent integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Sales / Checkouts Table (if not exists)
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  bill_no text not null unique,
  item_code text not null,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_amount numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- This is the most critical security step. With RLS enabled, the public 'anon'
-- key can ONLY perform actions explicitly permitted by the policies below.
-- =============================================================================

alter table public.products enable row level security;
alter table public.sales enable row level security;

-- Drop existing policies if re-running to avoid duplicate policy errors
drop policy if exists "Allow public read-only access to products" on public.products;
drop policy if exists "Allow authenticated admins to insert products" on public.products;
drop policy if exists "Allow authenticated admins to update products" on public.products;
drop policy if exists "Allow authenticated admins to delete products" on public.products;

drop policy if exists "Allow public to record a sale at checkout" on public.sales;
drop policy if exists "Allow authenticated admins to view sales reports" on public.sales;

-- =============================================================================
-- 4. PRODUCTS POLICIES
-- =============================================================================

-- Any visitor or customer can view the product catalogue
create policy "Allow public read-only access to products"
  on public.products
  for select
  using (true);

-- Only authenticated staff/admin can add new products
create policy "Allow authenticated admins to insert products"
  on public.products
  for insert
  to authenticated
  with check (true);

-- Only authenticated staff/admin can update product details, stock, or discounts
create policy "Allow authenticated admins to update products"
  on public.products
  for update
  to authenticated
  using (true)
  with check (true);

-- Only authenticated staff/admin can delete products
create policy "Allow authenticated admins to delete products"
  on public.products
  for delete
  to authenticated
  using (true);

-- =============================================================================
-- 5. SALES & CHECKOUT POLICIES
-- =============================================================================

-- Anyone at counter checkout can insert a completed transaction
create policy "Allow public to record a sale at checkout"
  on public.sales
  for insert
  using (true)
  with check (true);

-- Only authenticated staff/admins can view sales history and daily revenue reports
create policy "Allow authenticated admins to view sales reports"
  on public.sales
  for select
  to authenticated
  using (true);
