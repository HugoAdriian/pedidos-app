-- =====================================================================
-- Datos de ejemplo (opcional)
--
-- Ejecutar DESPUÉS de registrar al menos un usuario desde la app: el negocio
-- de ejemplo se asigna como dueño al primer perfil creado.
-- Ejecutar una sola vez (el slug del negocio es único).
-- =====================================================================

with owner as (
  select id from public.profiles order by created_at limit 1
),
biz as (
  insert into public.businesses (owner_id, name, slug, description, address, phone, latitude, longitude)
  select id, 'Café Aroma', 'cafe-aroma',
         'Café de especialidad y repostería artesanal',
         'Av. Reforma 123, CDMX', '555-123-4567',
         19.4270, -99.1677
  from owner
  returning id
),
cats as (
  insert into public.categories (business_id, name, sort_order)
  select biz.id, c.name, c.ord
  from biz, (values ('Cafés', 1), ('Postres', 2), ('Alimentos', 3)) as c(name, ord)
  returning id, name, business_id
),
prods as (
  insert into public.products (business_id, category_id, name, description, price)
  select cats.business_id, cats.id, p.name, p.descr, p.price
  from cats
  join (values
    ('Cafés',     'Latte',             'Espresso con leche vaporizada',            55.00),
    ('Cafés',     'Americano',         'Espresso con agua caliente',               40.00),
    ('Postres',   'Cheesecake',        'Rebanada de cheesecake de frutos rojos',   75.00),
    ('Postres',   'Brownie',           'Brownie de chocolate con nuez',            45.00),
    ('Alimentos', 'Sándwich de pollo', 'Pan artesanal con pollo, queso y lechuga', 85.00),
    ('Alimentos', 'Chilaquiles',       'Chilaquiles verdes con pollo',             95.00)
  ) as p(cat, name, descr, price) on p.cat = cats.name
  returning id, name
),
grp as (
  insert into public.option_groups (product_id, name, required, max_select)
  select id, 'Tamaño', true, 1 from prods where name in ('Latte', 'Americano')
  returning id
)
insert into public.options (group_id, name, price_delta)
select grp.id, o.name, o.delta
from grp, (values ('Chico', 0), ('Mediano', 10), ('Grande', 20)) as o(name, delta);
