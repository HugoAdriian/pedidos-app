-- =====================================================================
-- 004 · create_order(): crea un pedido completo de forma atómica
--
-- - Recalcula los precios en el servidor (el cliente no puede manipularlos).
-- - Valida que el negocio esté abierto y que los productos estén disponibles.
-- - Todo o nada: si algo falla, no se guarda nada.
-- - security definer: corre con permisos propios, por eso los usuarios no
--   necesitan permiso de INSERT directo sobre las tablas de pedidos.
-- =====================================================================

create or replace function public.create_order(
  p_business_id uuid,
  p_type order_type,
  p_notes text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product products%rowtype;
  v_item_id uuid;
  v_opt_ids uuid[];
  v_extra numeric;
  v_unit numeric;
  v_qty int;
  v_total numeric := 0;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;
  if not exists (select 1 from businesses where id = p_business_id and is_open) then
    raise exception 'El negocio está cerrado';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido está vacío';
  end if;

  insert into orders (business_id, customer_id, type, notes, total)
  values (p_business_id, auth.uid(), p_type, p_notes, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 then
      raise exception 'Cantidad inválida';
    end if;

    select * into v_product from products
    where id = (v_item->>'product_id')::uuid
      and business_id = p_business_id
      and is_available;
    if not found then
      raise exception 'Un producto ya no está disponible';
    end if;

    select coalesce(array_agg(x::uuid), '{}') into v_opt_ids
    from jsonb_array_elements_text(coalesce(v_item->'option_ids', '[]'::jsonb)) as x;

    select coalesce(sum(o.price_delta), 0) into v_extra
    from options o join option_groups g on g.id = o.group_id
    where o.id = any(v_opt_ids) and g.product_id = v_product.id;

    v_unit := v_product.price + v_extra;
    v_total := v_total + v_unit * v_qty;

    insert into order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order_id, v_product.id, v_product.name, v_unit, v_qty)
    returning id into v_item_id;

    insert into order_item_options (order_item_id, option_name, price_delta)
    select v_item_id, o.name, o.price_delta
    from options o join option_groups g on g.id = o.group_id
    where o.id = any(v_opt_ids) and g.product_id = v_product.id;
  end loop;

  update orders set total = v_total where id = v_order_id;
  return v_order_id;
end
$$;

-- Solo usuarios con sesión pueden usarla
revoke all on function public.create_order(uuid, order_type, text, jsonb) from public, anon;
grant execute on function public.create_order(uuid, order_type, text, jsonb) to authenticated;
