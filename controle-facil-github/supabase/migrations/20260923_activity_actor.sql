-- Execute no SQL Editor do Supabase depois de atualizar o aplicativo.
-- Esta migração não apaga dados nem recria tabelas.

alter table public.stock_movements
  add column if not exists actor_id uuid references public.profiles(id),
  add column if not exists actor_name text;

create index if not exists movements_actor_id_idx
  on public.stock_movements(actor_id);

-- O histórico detalhado fica disponível somente para a dona.
drop policy if exists "owners read movement actors" on public.stock_movements;
create policy "owners read movement actors"
  on public.stock_movements
  for select
  using (public.is_store_owner(store_id));

-- Garante que as novas movimentações possam chegar ao painel em tempo real.
do $$
begin
  alter publication supabase_realtime add table public.stock_movements;
exception
  when duplicate_object then null;
end $$;
