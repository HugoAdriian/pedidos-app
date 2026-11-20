import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { OrderStatus, STATUS_LABELS } from '@/features/orders/api';
import { BusinessOrder, fetchBusinessOrders, updateOrderStatus } from '@/features/my-business/orders';
import { useBusinessOrdersRealtime } from '@/features/orders/useBusinessOrdersRealtime';

const NEXT_STEP: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  pending: { label: 'Aceptar pedido', to: 'accepted' },
  accepted: { label: 'Empezar a preparar', to: 'preparing' },
  preparing: { label: 'Marcar como listo', to: 'ready' },
  ready: { label: 'Marcar como entregado', to: 'completed' },
};

const ACTIVE: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];

export default function BusinessOrdersScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useBusinessOrdersRealtime(businessId);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['business-orders', businessId],
    queryFn: () => fetchBusinessOrders(businessId),
    enabled: !!businessId,
  });

  async function changeStatus(orderId: string, status: OrderStatus) {
    try {
      await updateOrderStatus(orderId, status);
      queryClient.invalidateQueries({ queryKey: ['business-orders', businessId] });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar el pedido');
    }
  }

  function cancelOrder(orderId: string) {
    Alert.alert('Cancelar pedido', '¿Seguro que quieres cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => changeStatus(orderId, 'cancelled') },
    ]);
  }

  const orders = (data ?? []).filter((o) => (tab === 'active' ? ACTIVE.includes(o.status) : !ACTIVE.includes(o.status)));
  // En activos, los más antiguos primero (se atienden en orden de llegada)
  const visible = tab === 'active' ? orders.slice().reverse() : orders;

  function renderOrder(order: BusinessOrder) {
    const status = STATUS_LABELS[order.status];
    const next = NEXT_STEP[order.status];
    const canCancel = ACTIVE.includes(order.status) && order.status !== 'ready';

    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <ThemedText type="subtitle">{order.profiles?.full_name || 'Cliente'}</ThemedText>
            {order.profiles?.phone && <ThemedText type="small">Tel. {order.profiles.phone}</ThemedText>}
          </View>
          <View style={[styles.badge, { backgroundColor: status.color }]}>
            <ThemedText style={styles.badgeText}>{status.label}</ThemedText>
          </View>
        </View>

        <ThemedText type="small">{new Date(order.created_at).toLocaleString('es-MX')}</ThemedText>

        <View style={styles.lines}>
          {order.order_items.map((item) => {
            const options = item.order_item_options.map((o) => o.option_name).join(', ');
            return (
              <ThemedText key={item.id}>
                {item.quantity}× {item.product_name}
                {options ? ` (${options})` : ''}
              </ThemedText>
            );
          })}
        </View>

        {order.notes && <ThemedText type="small">Nota: {order.notes}</ThemedText>}
        <ThemedText style={styles.total}>Total: ${order.total.toFixed(2)}</ThemedText>

        {next && (
          <Pressable style={styles.primaryButton} onPress={() => changeStatus(order.id, next.to)}>
            <ThemedText style={styles.buttonText}>{next.label}</ThemedText>
          </Pressable>
        )}
        {canCancel && (
          <Pressable onPress={() => cancelOrder(order.id)}>
            <ThemedText type="small" style={styles.cancel}>Cancelar pedido</ThemedText>
          </Pressable>
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabs}>
        {(['active', 'history'] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setTab(value)}
            style={[styles.tab, tab === value && styles.tabActive]}>
            <ThemedText style={tab === value ? styles.tabTextActive : undefined}>
              {value === 'active' ? 'Activos' : 'Historial'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <ThemedText style={styles.error}>
          No se pudieron cargar los pedidos: {error instanceof Error ? error.message : ''}
        </ThemedText>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderOrder(item)}
          contentContainerStyle={styles.list}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>
              {tab === 'active' ? 'No hay pedidos activos' : 'Todavía no hay pedidos en el historial'}
            </ThemedText>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { marginTop: 40 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: Brand.neutral + '33' },
  tabActive: { backgroundColor: Brand.primary },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 20, gap: 12 },
  card: { borderRadius: 16, padding: 16, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  lines: { gap: 2, marginTop: 6 },
  total: { fontWeight: '600', marginTop: 6 },
  primaryButton: { backgroundColor: Brand.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  cancel: { color: Brand.danger, textAlign: 'center', marginTop: 6 },
  error: { color: Brand.danger, textAlign: 'center', marginTop: 24, paddingHorizontal: 20 },
  empty: { textAlign: 'center', marginTop: 40 },
});
