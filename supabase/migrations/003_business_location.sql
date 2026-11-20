-- =====================================================================
-- 003 · Ubicación de los negocios (para el botón "Cómo llegar")
-- =====================================================================

alter table public.businesses
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180);
