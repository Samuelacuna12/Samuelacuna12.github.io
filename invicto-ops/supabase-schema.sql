-- INVICTO OPS · Esquema inicial (MVP manual, preparado para APIs)
-- No ejecutar aún sin revisar contra el proyecto Supabase definitivo.

create extension if not exists pgcrypto;

create type app_role as enum ('admin','gerencia','vendedor','logistica');
create type sale_status as enum ('nueva','asignada','en_gestion','no_contesta','seguimiento_programado','pendiente_stock','confirmada','perdida','duplicada','cancelada');
create type logistics_status as enum ('pendiente','lista_despacho','guia_generada','en_transito','reclama_oficina','entregada','novedad','devuelta','cancelada');
create type warranty_status as enum ('abierta','en_gestion','esperando_externo','pendiente_validacion_admin','requiere_gestion_adicional','cerrada');
create type novelty_status as enum ('abierta','en_gestion','esperando_externo','pendiente_validacion_admin','cerrada');
create type severity as enum ('info','amarilla','roja');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role app_role not null default 'vendedor',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table work_schedules (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6),
  enabled boolean not null default true,
  starts_at time,
  ends_at time,
  unique(weekday)
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  city text,
  department text,
  address text,
  created_at timestamptz not null default now()
);
create index customers_phone_idx on customers(phone);

create table sales (
  id uuid primary key default gen_random_uuid(),
  daily_number int,
  commercial_date date not null default current_date,
  received_at timestamptz not null default now(),
  customer_id uuid references customers(id),
  source text,
  assigned_to uuid references profiles(id),
  status sale_status not null default 'nueva',
  loss_reason text,
  valid_for_conversion boolean not null default true,
  quantity int,
  total_price numeric(12,2),
  payment_method text,
  confirmed_at timestamptz,
  confirmed_by uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sales_commercial_date_idx on sales(commercial_date);
create index sales_assigned_to_idx on sales(assigned_to);

create table sale_attempts (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  advisor_id uuid not null references profiles(id),
  attempt_number int,
  channel text not null check(channel in ('llamada','whatsapp')),
  outcome text,
  occurred_at timestamptz not null default now(),
  next_followup_at timestamptz,
  notes text
);

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  operator text not null check(operator in ('Hoko','LogiGho','Invicto')),
  name text not null,
  city text not null,
  active boolean not null default true
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  internal_sku text unique not null,
  category text not null,
  material text,
  style text,
  size text not null,
  design_or_color text not null,
  active boolean not null default true
);

create table external_product_ids (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references product_variants(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  external_id text not null,
  external_name text,
  unique(warehouse_id, external_id)
);

create table inventory (
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  product_variant_id uuid not null references product_variants(id) on delete cascade,
  on_hand int not null default 0,
  reserved int not null default 0,
  updated_at timestamptz not null default now(),
  primary key(warehouse_id, product_variant_id),
  constraint inventory_nonnegative_reserved check (reserved >= 0)
);

create view inventory_available as
select warehouse_id, product_variant_id, on_hand, reserved, (on_hand-reserved) as available
from inventory;

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  line_number int not null,
  product_variant_id uuid not null references product_variants(id),
  warehouse_id uuid references warehouses(id),
  quantity int not null default 1,
  allocated_price numeric(12,2),
  unique(sale_id,line_number)
);

create table stock_reservations (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  sale_item_id uuid not null references sale_items(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id),
  product_variant_id uuid not null references product_variants(id),
  quantity int not null,
  status text not null check(status in ('reserved','released','consumed','returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id),
  warehouse_id uuid not null references warehouses(id),
  carrier text,
  tracking_number text,
  status logistics_status not null default 'pendiente',
  office_pickup boolean not null default false,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz not null default now()
);

create table shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  status logistics_status not null,
  source text not null default 'manual',
  occurred_at timestamptz not null default now(),
  raw_data jsonb
);

create table dispatch_cuts (
  id uuid primary key default gen_random_uuid(),
  cut_type text not null check(cut_type in ('11am','5pm','manual')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table dispatch_cut_sales (
  cut_id uuid references dispatch_cuts(id) on delete cascade,
  sale_id uuid references sales(id) on delete cascade,
  primary key(cut_id,sale_id)
);

create table warranties (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id),
  owner_advisor_id uuid not null references profiles(id),
  reason text not null check(reason in ('calidad_defectuoso','talla_equivocada','diseno_equivocado','faltante')),
  probable_responsible text,
  validated_responsible text,
  status warranty_status not null default 'abierta',
  proposed_solution text,
  admin_solution text,
  transfer_amount numeric(12,2),
  transfer_done boolean not null default false,
  last_customer_update_at timestamptz,
  admin_decision_due_at timestamptz,
  closed_at timestamptz,
  closed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table logistics_novelties (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id),
  shipment_id uuid references shipments(id),
  owner_advisor_id uuid references profiles(id),
  description text not null,
  status novelty_status not null default 'abierta',
  source text not null default 'manual',
  source_file_name text,
  imported_phone text,
  imported_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  sale_id uuid references sales(id),
  warranty_id uuid references warranties(id),
  novelty_id uuid references logistics_novelties(id),
  severity severity not null,
  title text not null,
  body text,
  blocking boolean not null default false,
  status text not null default 'open' check(status in ('open','acknowledged','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id)
);

create table audit_log (
  id bigserial primary key,
  actor_id uuid references profiles(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table monthly_targets (
  id uuid primary key default gen_random_uuid(),
  month_start date unique not null,
  target_confirmed_sales int not null,
  created_at timestamptz not null default now()
);

-- Seguridad: RLS debe configurarse antes de producción según rol.
-- El navegador jamás debe recibir credenciales de Hoko/LogiGho.
