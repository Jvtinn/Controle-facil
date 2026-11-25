-- Execute este arquivo no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  welcome_message text not null default 'Organize sua loja com simplicidade',
  logo_data_url text not null default '',
  brand_colors jsonb not null default '{"pink":"#db2777","yellow":"#facc15","blue":"#1d4ed8"}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.store_memberships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  role text not null check (role in ('owner', 'employee')),
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

create table public.products (
  id text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  category text not null default 'Outros',
  unit text not null default 'un',
  price numeric not null default 0,
  cost_price numeric not null default 0,
  current_stock numeric not null default 0,
  min_stock numeric not null default 0,
  last_movement_date date not null default current_date,
  barcode text,
  supplier_id text,
  supplier_name text,
  updated_at timestamptz not null default now()
);

create table public.stock_movements (
  id text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  type text not null check (type in ('sale', 'restock', 'adjustment')),
  quantity numeric not null,
  previous_stock numeric not null,
  new_stock numeric not null,
  date timestamptz not null default now(),
  unit_value numeric not null default 0,
  total_value numeric not null default 0,
  payment_method text,
  note text,
  actor_id uuid references public.profiles(id),
  actor_name text
);

create table public.extra_expenses (
  id text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  description text not null,
  amount numeric not null,
  date timestamptz not null default now()
);

create table public.suppliers (
  id text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create index products_store_id_idx on public.products(store_id);
create index movements_store_id_idx on public.stock_movements(store_id);
alter table public.stock_movements add column if not exists actor_id uuid references public.profiles(id);
alter table public.stock_movements add column if not exists actor_name text;
create index suppliers_store_id_idx on public.suppliers(store_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name) values (new.id, coalesce(new.email, ''), new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_store_member(target_store uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.store_memberships where user_id = auth.uid() and store_id = target_store);
$$;
create or replace function public.is_store_owner(target_store uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.store_memberships where user_id = auth.uid() and store_id = target_store and role = 'owner');
$$;

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.extra_expenses enable row level security;
alter table public.suppliers enable row level security;

create policy "users read profiles in own store" on public.profiles for select using (id = auth.uid() or exists (select 1 from public.store_memberships mine join public.store_memberships target on target.store_id = mine.store_id where mine.user_id = auth.uid() and target.user_id = profiles.id));
create policy "members read store" on public.stores for select using (public.is_store_member(id));
create policy "owners update store identity" on public.stores for update using (public.is_store_owner(id)) with check (public.is_store_owner(id));
create policy "members read memberships" on public.store_memberships for select using (user_id = auth.uid() or public.is_store_member(store_id));
create policy "users create own membership" on public.store_memberships for insert with check (user_id = auth.uid() and role = 'owner');
create policy "owners add memberships" on public.store_memberships for insert with check (public.is_store_owner(store_id));
create policy "owners update memberships" on public.store_memberships for update using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
create policy "owners remove memberships" on public.store_memberships for delete using (public.is_store_owner(store_id) and user_id <> auth.uid());
create policy "owners create stores" on public.stores for insert with check (auth.uid() is not null);
create policy "members read products" on public.products for select using (public.is_store_member(store_id));
create policy "members add products" on public.products for insert with check (public.is_store_member(store_id));
create policy "members update products" on public.products for update using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "owners delete products" on public.products for delete using (public.is_store_owner(store_id));
create policy "members read movements" on public.stock_movements for select using (public.is_store_member(store_id));
create policy "members add movements" on public.stock_movements for insert with check (public.is_store_member(store_id));
create policy "owners read movement actors" on public.stock_movements for select using (public.is_store_owner(store_id));
create policy "members read expenses" on public.extra_expenses for select using (public.is_store_member(store_id));
create policy "owners write expenses" on public.extra_expenses for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
create policy "members read suppliers" on public.suppliers for select using (public.is_store_member(store_id));
create policy "members add suppliers" on public.suppliers for insert with check (public.is_store_member(store_id));
create policy "members update suppliers" on public.suppliers for update using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "owners delete suppliers" on public.suppliers for delete using (public.is_store_owner(store_id));

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.stock_movements;
alter publication supabase_realtime add table public.stores;
