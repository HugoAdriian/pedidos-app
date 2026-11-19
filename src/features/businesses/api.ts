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
};

export async function fetchBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, slug, description, address, phone, logo_url, is_open')
    .order('name');

  if (error) throw new Error(error.message);
  return data as Business[];
}
