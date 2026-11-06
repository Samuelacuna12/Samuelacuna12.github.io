-- Public shared account: preserve the existing anonymous access model.
-- Expose only the columns needed by the editor; keep RLS enabled.
alter table public.carlos_movements add column if not exists updated_at timestamptz not null default now();
alter table public.carlos_movements enable row level security;
alter table public.carlos_delivery_items enable row level security;
create policy carlos_shared_read on public.carlos_movements for select to anon, authenticated using (true);
create policy carlos_shared_edit on public.carlos_movements for update to anon, authenticated using (true) with check (true);
grant select on public.carlos_movements to anon, authenticated;
grant update (movement_date,amount,reference,notes,updated_at) on public.carlos_movements to anon, authenticated;
create policy carlos_shared_items_read on public.carlos_delivery_items for select to anon, authenticated using (true);
create policy carlos_shared_items_add on public.carlos_delivery_items for insert to anon, authenticated with check (true);
create policy carlos_shared_items_replace on public.carlos_delivery_items for delete to anon, authenticated using (true);
grant select, insert, delete on public.carlos_delivery_items to anon, authenticated;

create table public.carlos_comments (
 id uuid primary key default gen_random_uuid(),
 movement_id uuid not null references public.carlos_movements(id) on delete cascade,
 body text not null check (length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index carlos_comments_movement_idx on public.carlos_comments(movement_id,created_at);
alter table public.carlos_comments enable row level security;
create policy carlos_shared_comments_read on public.carlos_comments for select to anon, authenticated using (true);
create policy carlos_shared_comments_add on public.carlos_comments for insert to anon, authenticated with check (true);
grant select on public.carlos_comments to anon, authenticated;
grant insert (movement_id,body) on public.carlos_comments to anon, authenticated;

create or replace function public.carlos_public_edit_movement(
 p_id uuid, p_date date, p_amount numeric, p_reference text, p_notes text,
 p_items jsonb, p_expected_updated_at timestamptz
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare v public.carlos_movements%rowtype; x jsonb; v_amount numeric;
begin
 select * into v from public.carlos_movements where id=p_id for update;
 if not found then raise exception 'El movimiento ya no existe. Actualiza la página.'; end if;
 if v.updated_at is distinct from p_expected_updated_at then
   raise exception 'Este movimiento cambió. Actualiza la página antes de editarlo.';
 end if;
 if p_date is null then raise exception 'Ingresa una fecha válida'; end if;
 v_amount := p_amount;
 if v.movement_type='delivery' then
   if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Agrega el detalle de la entrega'; end if;
   if jsonb_array_length(p_items)=0 then raise exception 'Agrega al menos una línea'; end if;
   v_amount:=0;
   for x in select * from jsonb_array_elements(p_items) loop
     if coalesce((x->>'quantity')::numeric,0)<=0 or (x->>'quantity')::numeric<>trunc((x->>'quantity')::numeric)
       or coalesce((x->>'unit_cost')::numeric,0)<=0 then raise exception 'Revisa cantidades y costos'; end if;
     v_amount:=v_amount+(x->>'quantity')::numeric*(x->>'unit_cost')::numeric;
   end loop;
 else
   if p_items is not null then raise exception 'Una consignación no tiene líneas de producción'; end if;
 end if;
 if v_amount is null or v_amount<=0 or v_amount::text in ('NaN','Infinity','-Infinity') then raise exception 'Ingresa un valor válido'; end if;
 update public.carlos_movements set movement_date=p_date,amount=v_amount,
 reference=nullif(trim(p_reference),''),notes=nullif(trim(p_notes),''),updated_at=clock_timestamp() where id=p_id;
 if v.movement_type='delivery' then
   delete from public.carlos_delivery_items where movement_id=p_id;
   insert into public.carlos_delivery_items(movement_id,product_type,design_type,material,size,quantity,unit_cost)
   select p_id,item->>'product_type',item->>'design_type',item->>'material',item->>'size',(item->>'quantity')::integer,(item->>'unit_cost')::numeric
   from jsonb_array_elements(p_items) as entries(item);
 end if;
 return true;
end $$;
revoke all on function public.carlos_public_edit_movement(uuid,date,numeric,text,text,jsonb,timestamptz) from public;
grant execute on function public.carlos_public_edit_movement(uuid,date,numeric,text,text,jsonb,timestamptz) to anon,authenticated;
