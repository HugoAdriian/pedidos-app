import { OrderStatus } from '@/features/orders/api';
import { supabase } from '@/lib/supabase';

export type BusinessOrder = {
  id: string;
  status: OrderStatus;
  type: 'pickup' | 'delivery';
  total: number;
  notes: string | null;
  created_at: string;
  profiles: { full_name: string; phone: string | null } | null;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    order_item_options: { option_name: string }[];
  }[];
};

export async function fetchBusinessOrders(businessId: string): Promise<BusinessOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, status, type, total, notes, created_at, profiles(full_name, phone), order_items(id, product_name, quantity, order_item_options(option_name))'
    )
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as BusinessOrder[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw new Error(error.message);
}
