import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import {
  createCategory,
  deleteCategory,
  fetchMyMenu,
  MyMenuCategory,
  setBusinessOpen,
  setProductAvailable,
} from '@/features/my-business/api';

export default function MyBusinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-menu', id],
    queryFn: () => fetchMyMenu(id),
    enabled: !!id,
  });

  const [newCategory, setNewCategory] = useState('');

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['my-menu', id] });
    queryClient.invalidateQueries({ queryKey: ['business', id] });
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
    queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
  }

  async function run(action: () => Promise<void>) {
    try {
      await action();
      refresh();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Algo salió mal');
    }
  }

  function addCategory() {
    const name = newCategory.trim();
    if (!name || !data) return;
    const nextOrder = Math.max(0, ...data.categories.map((c) => c.sort_order)) + 1;
    run(async () => {
      await createCategory(id, name, nextOrder);
      setNewCategory('');
    });
  }

  function removeCategory(category: MyMenuCategory) {
    if (category.products.length > 0) {
      Alert.alert('No se puede eliminar', 'Primero elimina los productos de esta categoría.');
      return;
    }
    Alert.alert('Eliminar categoría', `¿Eliminar "${category.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => run(() => deleteCategory(category.id)) },
    ]);
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error || !data) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.error}>
          No se pudo cargar tu cafetería: {error instanceof Error ? error.message : ''}
        </ThemedText>
      </ThemedView>
    );
  }

  const categories = data.categories.slice().sort((a, b) => a.sort_order - b.sort_order);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">{data.name}</ThemedText>

        <ThemedView type="backgroundElement" style={styles.rowCard}>
          <View style={styles.flex}>
            <ThemedText style={styles.bold}>{data.is_open ? 'Abierta' : 'Cerrada'}</ThemedText>
            <ThemedText type="small">Los clientes solo pueden pedir cuando está abierta</ThemedText>
          </View>
          <Switch value={data.is_open} onValueChange={(value) => run(() => setBusinessOpen(id, value))} />
        </ThemedView>

        <Pressable
          style={styles.ordersButton}
          onPress={() =>
            router.push({ pathname: '/my-business/orders', params: { businessId: id } })
          }>
          <ThemedText style={styles.buttonText}>Ver pedidos recibidos</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">Menú</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Nueva categoría (ej. Cafés)"
            placeholderTextColor="#888"
            value={newCategory}
            onChangeText={setNewCategory}
          />
          <Pressable style={styles.primaryButton} onPress={addCategory}>
            <ThemedText style={styles.buttonText}>Agregar categoría</ThemedText>
          </Pressable>
        </ThemedView>

        {categories.length === 0 && (
          <ThemedText type="small" style={styles.hint}>
            Crea tu primera categoría para empezar a agregar productos.
          </ThemedText>
        )}

        {categories.map((category) => (
          <ThemedView key={category.id} type="backgroundElement" style={styles.card}>
            <View style={styles.categoryHeader}>
              <ThemedText type="subtitle" style={styles.flex}>{category.name}</ThemedText>
              <Pressable onPress={() => removeCategory(category)}>
                <ThemedText type="small" style={styles.remove}>Eliminar</ThemedText>
              </Pressable>
            </View>

            {category.products.map((product) => (
              <Pressable
                key={product.id}
                onPress={() =>
                  router.push({
                    pathname: '/my-business/product-form',
                    params: { businessId: id, productId: product.id },
                  })
                }>
                <View style={styles.productRow}>
                  <View style={styles.flex}>
                    <ThemedText style={styles.bold}>{product.name}</ThemedText>
                    <ThemedText type="small">
                      ${product.price.toFixed(2)}
                      {product.is_available ? '' : ' · No disponible'}
                    </ThemedText>
                  </View>
                  <Switch
                    value={product.is_available}
                    onValueChange={(value) => run(() => setProductAvailable(product.id, value))}
                  />
                </View>
              </Pressable>
            ))}

            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                router.push({
                  pathname: '/my-business/product-form',
                  params: { businessId: id, categoryId: category.id },
                })
              }>
              <ThemedText style={styles.buttonText}>+ Agregar producto</ThemedText>
            </Pressable>
          </ThemedView>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  rowCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, gap: 12 },
  card: { borderRadius: 16, padding: 16, gap: 10 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  primaryButton: { backgroundColor: Brand.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryButton: { backgroundColor: Brand.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  ordersButton: { backgroundColor: Brand.info, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  remove: { color: Brand.danger },
  hint: { textAlign: 'center' },
  error: { color: Brand.danger, textAlign: 'center' },
});
