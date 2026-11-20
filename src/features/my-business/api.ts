import { supabase } from '@/lib/supabase';

export type MyBusiness = {
  id: string;
  name: string;
  is_open: boolean;
};

export async function fetchMyBusinesses(userId: string): Promise<MyBusiness[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, is_open')
    .eq('owner_id', userId)
    .order('created_at');

  if (error) throw new Error(error.message);
  return data as MyBusiness[];
}

export type NewBusiness = {
  owner_id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
};

// "Café Aroma" -> "cafe-aroma-x7k2" (único gracias al sufijo aleatorio)
function slugify(name: string) {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base || 'negocio'}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createBusiness(input: NewBusiness) {
  const { error } = await supabase
    .from('businesses')
    .insert({ ...input, slug: slugify(input.name) });

  if (error) throw new Error(error.message);
}

export type MyMenuProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
};

export type MyMenuCategory = {
  id: string;
  name: string;
  sort_order: number;
  products: MyMenuProduct[];
};

export type MyMenu = {
  id: string;
  name: string;
  is_open: boolean;
  categories: MyMenuCategory[];
};

export async function fetchMyMenu(businessId: string): Promise<MyMenu> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, is_open, categories(id, name, sort_order, products(id, name, description, price, is_available))')
    .eq('id', businessId)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as MyMenu;
}

export async function setBusinessOpen(businessId: string, isOpen: boolean) {
  const { error } = await supabase.from('businesses').update({ is_open: isOpen }).eq('id', businessId);
  if (error) throw new Error(error.message);
}

export async function createCategory(businessId: string, name: string, sortOrder: number) {
  const { error } = await supabase
    .from('categories')
    .insert({ business_id: businessId, name, sort_order: sortOrder });
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export type ProductInput = {
  business_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
};

export async function createProduct(input: ProductInput) {
  const { error } = await supabase.from('products').insert(input);
  if (error) throw new Error(error.message);
}

export async function updateProduct(id: string, input: Omit<ProductInput, 'business_id'>) {
  const { error } = await supabase.from('products').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setProductAvailable(id: string, isAvailable: boolean) {
  const { error } = await supabase.from('products').update({ is_available: isAvailable }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
