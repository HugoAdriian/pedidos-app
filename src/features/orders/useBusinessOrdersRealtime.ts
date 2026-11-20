import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Vibration } from 'react-native';

import { supabase } from '@/lib/supabase';

// Refresca la bandeja del negocio cuando cambia un pedido, y vibra si llega uno nuevo
export function useBusinessOrdersRealtime(businessId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`business-orders-${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') Vibration.vibrate(400);
          queryClient.invalidateQueries({ queryKey: ['business-orders', businessId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, queryClient]);
}
