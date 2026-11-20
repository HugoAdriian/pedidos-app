import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchOrders, Order, STATUS_LABELS } from '@/features/orders/api';

function OrderCard({ order }: { order: Order }) {
  const status = STATUS_LABELS[order.status];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="subtitle" style={styles.cardTitle}>{order.businesses.name}</ThemedText>
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
    </ThemedView>
  );
}

export default function OrdersScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['orders', userId],
    queryFn: fetchOrders,
    enabled: !!userId,
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>Mis pedidos</ThemedText>

        {isLoading ? (
          <ActivityIndicator style={styles.center} />
        ) : error ? (
          <ThemedText style={styles.error}>
            No se pudieron cargar los pedidos: {error instanceof Error ? error.message : ''}
          </ThemedText>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <OrderCard order={item} />}
            contentContainerStyle={styles.list}
            refreshing={isRefetching}
            onRefresh={refetch}
            ListEmptyComponent={
              <ThemedText style={styles.empty}>Todavía no has hecho ningún pedido</ThemedText>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { textAlign: 'center', marginBottom: 16 },
  center: { marginTop: 40 },
  list: { gap: 12, paddingBottom: 24 },
  card: { borderRadius: 16, padding: 16, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { flexShrink: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  lines: { gap: 2, marginTop: 6 },
  total: { fontWeight: '600', marginTop: 6 },
  error: { color: Brand.danger, textAlign: 'center', marginTop: 24 },
  empty: { textAlign: 'center', marginTop: 40 },
});
