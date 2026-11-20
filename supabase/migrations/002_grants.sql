-- =====================================================================
-- 002 · Privilegios base para los roles de la API (anon / authenticated)
-- Las políticas RLS solo funcionan si antes se concede el privilegio.
-- =====================================================================

grant usage on schema public to anon, authenticated;

-- Catálogo: lectura pública; escritura solo con sesión (RLS limita por fila)
grant select on public.businesses, public.categories, public.products,
                public.option_groups, public.options to anon, authenticated;
grant insert, update, delete on public.businesses, public.categories, public.products,
                public.option_groups, public.options to authenticated;

-- Perfiles
grant select, update on public.profiles to authenticated;

-- Pedidos
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items, public.order_item_options to authenticated;
