import { supabase } from '@/lib/supabase';

export type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  is_open: boolean;
  latitude: number | null;
  longitude: number | null;
};

export async function fetchBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, slug, description, address, phone, logo_url, is_open, latitude, longitude')
    .order('name');

  if (error) throw new Error(error.message);
  return data as Business[];
}

export type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  sort_order: number;
  products: MenuProduct[];
};

export type BusinessMenu = Business & { categories: MenuCategory[] };

export async function fetchBusinessMenu(id: string): Promise<BusinessMenu> {
  const { data, error } = await supabase
    .from('businesses')
    .select(
      'id, name, slug, description, address, phone, logo_url, is_open, latitude, longitude, categories(id, name, sort_order, products(id, name, description, price, is_available))'
    )
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as BusinessMenu;
}

export type ProductOption = { id: string; name: string; price_delta: number };

export type ProductOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  max_select: number;
  options: ProductOption[];
};

export type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  business_id: string;
  businesses: { name: string };
  option_groups: ProductOptionGroup[];
};

export async function fetchProduct(id: string): Promise<ProductDetail> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, description, price, business_id, businesses(name), option_groups(id, name, required, max_select, options(id, name, price_delta))'
    )
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as ProductDetail;
}
