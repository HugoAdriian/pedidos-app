-- =====================================================================
-- pedidos-app · Esquema de base de datos (Supabase / PostgreSQL)
-- App multi-negocio: cualquier local (cafetería, postres, comida)
-- publica su catálogo y los usuarios hacen pedidos.
-- =====================================================================

-- ---------- Tipos ----------
create type user_role as enum ('customer', 'owner');
create type order_status as enum
  ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled');
create type order_type as enum ('pickup', 'delivery');

-- ---------- Perfiles (extiende auth.users de Supabase) ----------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text,
  role        user_role not null default 'customer',
  created_at  timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Negocios ----------
create table businesses (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles(id) on delete cascade,
  name         text not null,
  slug         text not null unique,
  description  text,
  logo_url     text,
  address      text,
  phone        text,
  is_open      boolean not null default true,
  created_at   timestamptz not null default now()
);
create index on businesses(owner_id);

-- ---------- Categorías del menú (Cafés, Postres, Alimentos...) ----------
create table categories (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,
  sort_order   int not null default 0
);
create index on categories(business_id);

-- ---------- Productos ----------
create table products (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  category_id  uuid references categories(id) on delete set null,
  name         text not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  image_url    text,
  is_available boolean not null default true,
  created_at   timestamptz not null default now()
);
create index on products(business_id);
create index on products(category_id);

-- ---------- Personalización (tamaño, tipo de leche, extras...) ----------
create table option_groups (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  name        text not null,                    -- "Tamaño", "Leche", "Extras"
  required    boolean not null default false,
  max_select  int not null default 1 check (max_select >= 1)
);
create index on option_groups(product_id);

create table options (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references option_groups(id) on delete cascade,
  name         text not null,                   -- "Grande", "Avena", "Shot extra"
  price_delta  numeric(10,2) not null default 0
);
create index on options(group_id);

-- ---------- Pedidos ----------
create table orders (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete restrict,
  customer_id   uuid not null references profiles(id) on delete restrict,
  status        order_status not null default 'pending',
  type          order_type not null default 'pickup',
  delivery_address text,
  notes         text,
  total         numeric(10,2) not null check (total >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on orders(business_id, status);
create index on orders(customer_id, created_at desc);

-- Líneas del pedido: guardan una "foto" del nombre y precio al momento de
-- comprar, así cambiar el menú después no altera pedidos históricos.
create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,
  product_name  text not null,
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  quantity      int not null check (quantity > 0),
  notes         text
);
create index on order_items(order_id);

create table order_item_options (
  id             uuid primary key default gen_random_uuid(),
  order_item_id  uuid not null references order_items(id) on delete cascade,
  option_name    text not null,
  price_delta    numeric(10,2) not null default 0
);
create index on order_item_options(order_item_id);

-- ---------- Actualizar updated_at ----------
create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger orders_touch before update on orders
  for each row execute function touch_updated_at();

-- =====================================================================
-- Seguridad (Row Level Security)
-- =====================================================================
alter table profiles            enable row level security;
alter table businesses          enable row level security;
alter table categories          enable row level security;
alter table products            enable row level security;
alter table option_groups       enable row level security;
alter table options             enable row level security;
alter table orders              enable row level security;
alter table order_items         enable row level security;
alter table order_item_options  enable row level security;

-- Helper: ¿el usuario actual es dueño de este negocio?
create function is_business_owner(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from businesses where id = b and owner_id = auth.uid());
$$;

-- Perfiles: cada quien ve y edita el suyo
create policy "perfil propio (lectura)" on profiles for select using (id = auth.uid());
create policy "perfil propio (edición)" on profiles for update using (id = auth.uid());

-- Catálogo: lectura pública, escritura solo del dueño
create policy "negocios públicos" on businesses for select using (true);
create policy "dueño crea negocio" on businesses for insert with check (owner_id = auth.uid());
create policy "dueño edita negocio" on businesses for update using (owner_id = auth.uid());
create policy "dueño borra negocio" on businesses for delete using (owner_id = auth.uid());

create policy "categorías públicas" on categories for select using (true);
create policy "dueño gestiona categorías" on categories for all
  using (is_business_owner(business_id)) with check (is_business_owner(business_id));

create policy "productos públicos" on products for select using (true);
create policy "dueño gestiona productos" on products for all
  using (is_business_owner(business_id)) with check (is_business_owner(business_id));

create policy "grupos públicos" on option_groups for select using (true);
create policy "dueño gestiona grupos" on option_groups for all
  using (exists (select 1 from products p where p.id = product_id and is_business_owner(p.business_id)))
  with check (exists (select 1 from products p where p.id = product_id and is_business_owner(p.business_id)));

create policy "opciones públicas" on options for select using (true);
create policy "dueño gestiona opciones" on options for all
  using (exists (select 1 from option_groups g join products p on p.id = g.product_id
                 where g.id = group_id and is_business_owner(p.business_id)))
  with check (exists (select 1 from option_groups g join products p on p.id = g.product_id
                      where g.id = group_id and is_business_owner(p.business_id)));

-- Pedidos: el cliente ve y crea los suyos; el dueño ve y actualiza los de su negocio
create policy "cliente ve sus pedidos" on orders for select using (customer_id = auth.uid());
create policy "dueño ve pedidos del negocio" on orders for select using (is_business_owner(business_id));
create policy "cliente crea pedido" on orders for insert with check (customer_id = auth.uid());
create policy "dueño actualiza estado" on orders for update using (is_business_owner(business_id));

create policy "ver líneas de pedido" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id
          and (o.customer_id = auth.uid() or is_business_owner(o.business_id))));
create policy "cliente agrega líneas" on order_items for insert with check (
  exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

create policy "ver opciones de línea" on order_item_options for select using (
  exists (select 1 from order_items i join orders o on o.id = i.order_id
          where i.id = order_item_id
          and (o.customer_id = auth.uid() or is_business_owner(o.business_id))));
create policy "cliente agrega opciones de línea" on order_item_options for insert with check (
  exists (select 1 from order_items i join orders o on o.id = i.order_id
          where i.id = order_item_id and o.customer_id = auth.uid()));

-- Tiempo real: el dueño recibe pedidos nuevos al instante
alter publication supabase_realtime add table orders;
