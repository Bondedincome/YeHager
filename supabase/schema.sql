-- ==============================================================================
-- YeHagere Storefront - Supabase Database Schema
-- Run this script in your Supabase Project SQL Editor to provision all tables.
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table if not exists public.products (
  id bigint primary key generated always as identity,
  title text not null,
  name text,
  subtitle text,
  description text,
  price numeric not null default 0,
  price_etb numeric not null default 0,
  formatted_price_etb text,
  image_url text,
  gallery_images jsonb default '[]'::jsonb,
  category text default 'fall',
  is_new boolean default true,
  tag text default 'New',
  colors jsonb default '[]'::jsonb,
  sizes jsonb default '["XS", "S", "M", "L", "XL"]'::jsonb,
  stock integer default 10,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on products
alter table public.products enable row level security;

-- Allow public read access to products
create policy "Allow public read on products"
  on public.products for select
  using (true);

-- Allow all modifications for authenticated / service role
create policy "Allow insert on products"
  on public.products for insert
  with check (true);

create policy "Allow update on products"
  on public.products for update
  using (true);

create policy "Allow delete on products"
  on public.products for delete
  using (true);


-- 2. ORDERS TABLE
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  customer_name text,
  customer_email text,
  items jsonb not null default '[]'::jsonb,
  total_usd numeric not null default 0,
  total_etb numeric not null default 0,
  status text default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on orders
alter table public.orders enable row level security;

-- Allow public order insertion and read by order_number
create policy "Allow public order insertion"
  on public.orders for insert
  with check (true);

create policy "Allow public order read"
  on public.orders for select
  using (true);


-- 3. INQUIRIES TABLE
create table if not exists public.inquiries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  subject text default 'General Inquiry',
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on inquiries
alter table public.inquiries enable row level security;

-- Allow public submission of inquiries
create policy "Allow public inquiry insertion"
  on public.inquiries for insert
  with check (true);

create policy "Allow public inquiry read"
  on public.inquiries for select
  using (true);
