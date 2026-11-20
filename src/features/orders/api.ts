import { Brand } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type Order = {
  id: string;
  status: OrderStatus;
  type: 'pickup' | 'delivery';
  total: number;
  notes: string | null;
  created_at: string;
  businesses: { name: string };
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    order_item_options: { option_name: string }[];
  }[];
};

export const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: Brand.neutral },
  accepted: { label: 'Aceptado', color: Brand.info },
  preparing: { label: 'Preparando', color: Brand.accent },
  ready: { label: 'Listo para recoger', color: Brand.success },
  completed: { label: 'Entregado', color: Brand.neutralDark },
  cancelled: { label: 'Cancelado', color: Brand.danger },
};

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, status, type, total, notes, created_at, businesses(name), order_items(id, product_name, quantity, unit_price, order_item_options(option_name))'
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as Order[];
}
