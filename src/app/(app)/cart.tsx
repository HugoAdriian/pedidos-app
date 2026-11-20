import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { cartTotal, useCart } from '@/features/cart/store';
import { supabase } from '@/lib/supabase';

export default function CartScreen() {
  const { items, businessId, businessName, changeQuantity, clear } = useCart();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function placeOrder() {
    if (!businessId) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.rpc('create_order', {
      p_business_id: businessId,
      p_type: 'pickup',
      p_notes: notes.trim() || null,
      p_items: items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        option_ids: item.options.map((option) => option.id),
      })),
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    clear();
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    Alert.alert('¡Pedido enviado!', 'El negocio recibió tu pedido.');
    router.replace('/');
  }

  if (items.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Tu carrito está vacío</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<ThemedText type="subtitle">{businessName}</ThemedText>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <ThemedView type="backgroundElement" style={styles.item}>
            <View style={styles.info}>
              <ThemedText style={styles.name}>{item.name}</ThemedText>
              {item.options.length > 0 && (
                <ThemedText type="small">{item.options.map((o) => o.name).join(', ')}</ThemedText>
              )}
              <ThemedText type="small">${item.unitPrice.toFixed(2)} c/u</ThemedText>
            </View>
            <View style={styles.stepper}>
              <Pressable style={styles.stepButton} onPress={() => changeQuantity(item.key, -1)}>
                <ThemedText style={styles.stepText}>−</ThemedText>
              </Pressable>
              <ThemedText style={styles.quantity}>{item.quantity}</ThemedText>
              <Pressable style={styles.stepButton} onPress={() => changeQuantity(item.key, 1)}>
                <ThemedText style={styles.stepText}>+</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        )}
        ListFooterComponent={
          <TextInput
            style={[styles.notes, { backgroundColor: colors.backgroundElement, color: colors.text }]}
            placeholder="Notas para el negocio (opcional)"
            placeholderTextColor="#888"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        }
      />

      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <ThemedText type="subtitle">Total: ${cartTotal(items).toFixed(2)}</ThemedText>
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <Pressable style={styles.confirmButton} onPress={placeOrder} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.confirmText}>Confirmar pedido (recoger en tienda)</ThemedText>
          )}
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, gap: 4 },
  separator: { height: 8 },
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, gap: 12 },
  info: { flex: 1, gap: 2 },
  name: { fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#757575', alignItems: 'center', justifyContent: 'center' },
  stepText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  quantity: { minWidth: 24, textAlign: 'center', fontWeight: '600' },
  notes: { borderRadius: 12, padding: 14, marginTop: 16, minHeight: 70, fontSize: 16, textAlignVertical: 'top' },
  footer: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  error: { color: '#d32f2f' },
  confirmButton: { backgroundColor: '#2e7d32', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '600' },
});
