-- Flat RPC for Apple Shortcuts. Uses the same workspace capability and
-- existing write function as the web app; no additional table privileges.
create or replace function public.cuentas_invicto_shortcut_add(
  p_workspace_hash text,
  p_type text,
  p_amount numeric,
  p_description text,
  p_owner text,
  p_category text default 'Otros',
  p_apply_tax boolean default true
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_type text;
  v_owner text;
  v_category text;
  v_description text := btrim(p_description);
  v_id text := gen_random_uuid()::text;
  v_date date := (current_timestamp at time zone 'America/Bogota')::date;
  v_tax bigint;
begin
  if p_workspace_hash is null or p_workspace_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'Configuración de Invicto inválida';
  end if;
  v_type := case lower(btrim(p_type))
    when 'income' then 'income' when 'ingreso' then 'income'
    when 'expense' then 'expense' when 'gasto' then 'expense'
    else null end;
  if v_type is null then
    raise exception using errcode = '22023', message = 'Selecciona ingreso o gasto';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 9000000000000000
     or p_amount <> trunc(p_amount) then
    raise exception using errcode = '22023', message = 'Ingresa un valor positivo en pesos enteros';
  end if;
  if v_description is null or v_description = '' or char_length(v_description) > 500 then
    raise exception using errcode = '22023', message = 'Escribe un concepto de 1 a 500 caracteres';
  end if;
  v_owner := case lower(btrim(p_owner))
    when 'samuel' then 'Samuel' when 'omar' then 'Omar'
    when 'compartido' then 'Compartido' else null end;
  if v_owner is null then
    raise exception using errcode = '22023', message = 'Selecciona Samuel, Omar o Compartido';
  end if;
  select c into v_category
    from unnest(array['Ventas','Transferencia','Proveedores','Nómina','Publicidad',
      'Logística','Impuestos','Servicios','Otros']) as categories(c)
    where lower(c) = lower(btrim(p_category));
  if v_category is null then
    raise exception using errcode = '22023', message = 'Selecciona una categoría válida';
  end if;
  -- Retain p_apply_tax for API compatibility; every expense includes 4x1000.
  v_tax := case when v_type = 'expense'
    then round(p_amount * 0.004)::bigint else 0 end;
  perform public.cuentas_invicto_upsert_many(p_workspace_hash, jsonb_build_array(
    jsonb_build_object(
      'id',v_id, 'type',v_type, 'amount',p_amount::bigint,
      'tax',v_tax, 'description',v_description, 'date',v_date,
      'owner',v_owner, 'category',v_category
    )
  ));
  return jsonb_build_object('ok',true,'id',v_id,'message','Movimiento guardado en Invicto',
    'type',v_type,'amount',p_amount::bigint,'tax',v_tax,'date',v_date,
    'owner',v_owner,'category',v_category);
end;
$function$;

revoke all on function public.cuentas_invicto_shortcut_add(text,text,numeric,text,text,text,boolean) from public;
grant execute on function public.cuentas_invicto_shortcut_add(text,text,numeric,text,text,text,boolean)
  to anon, authenticated, service_role;

comment on function public.cuentas_invicto_shortcut_add(text,text,numeric,text,text,text,boolean)
  is 'Apple Shortcuts: validates one movement and uses existing workspace-scoped RPC. Defaults to today in Colombia and Otros. Always applies 4x1000 to expenses; never to income.';
notify pgrst, 'reload schema';
