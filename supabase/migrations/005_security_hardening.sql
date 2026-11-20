-- =====================================================================
-- 005 · Endurecimiento de seguridad
-- =====================================================================

-- El dueño puede ver nombre y teléfono de los clientes que le han hecho pedidos
create policy "dueño ve clientes de sus pedidos" on public.profiles
for select using (
  exists (
    select 1
    from public.orders o
    join public.businesses b on b.id = o.business_id
    where o.customer_id = profiles.id and b.owner_id = auth.uid()
  )
);

-- Los pedidos solo se crean con create_order(); nadie inserta directamente
-- (evita, por ejemplo, un pedido con total $0 saltándose la app).
revoke insert, update on public.orders from authenticated;
revoke insert on public.order_items, public.order_item_options from authenticated;

-- El dueño solo puede modificar el ESTADO de un pedido (permiso por columna)
grant update (status) on public.orders to authenticated;
