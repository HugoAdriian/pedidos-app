import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { createProduct, deleteProduct, fetchMyMenu, updateProduct } from '@/features/my-business/api';

export default function ProductFormScreen() {
  const { businessId, categoryId, productId } = useLocalSearchParams<{
    businessId: string;
    categoryId?: string;
    productId?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { data: menu, isLoading } = useQuery({
    queryKey: ['my-menu', businessId],
    queryFn: () => fetchMyMenu(businessId),
    enabled: !!businessId,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId ?? null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si estamos editando, rellena el formulario con el producto existente (una sola vez)
  useEffect(() => {
    if (!menu || !productId || loaded) return;
    for (const category of menu.categories) {
      const product = category.products.find((p) => p.id === productId);
      if (product) {
        setName(product.name);
        setDescription(product.description ?? '');
        setPrice(String(product.price));
        setSelectedCategory(category.id);
        setIsAvailable(product.is_available);
        setLoaded(true);
        return;
      }
    }
  }, [menu, productId, loaded]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['my-menu', businessId] });
    queryClient.invalidateQueries({ queryKey: ['business', businessId] });
    queryClient.invalidateQueries({ queryKey: ['product'] });
  }

  async function save() {
    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (!name.trim()) return setError('El nombre es obligatorio');
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return setError('Escribe un precio válido');
    if (!selectedCategory) return setError('Elige una categoría');

    setSaving(true);
    setError(null);
    try {
      const values = {
        category_id: selectedCategory,
        name: name.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        is_available: isAvailable,
      };
      if (productId) await updateProduct(productId, values);
      else await createProduct({ business_id: businessId, ...values });
      refresh();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!productId) return;
    Alert.alert('Eliminar producto', `¿Eliminar "${name}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(productId);
            refresh();
            router.back();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar');
          }
        },
      },
    ]);
  }

  if (isLoading || !menu) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  const inputStyle = [styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput style={inputStyle} placeholder="Nombre del producto *" placeholderTextColor="#888" value={name} onChangeText={setName} />
        <TextInput
          style={[...inputStyle, styles.multiline]}
          placeholder="Descripción (opcional)"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput style={inputStyle} placeholder="Precio *  (ej. 55.00)" placeholderTextColor="#888" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />

        <ThemedText type="subtitle">Categoría</ThemedText>
        {menu.categories.length === 0 ? (
          <ThemedText type="small">Primero crea una categoría en el panel de tu cafetería.</ThemedText>
        ) : (
          <View style={styles.chips}>
            {menu.categories
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((category) => {
                const active = selectedCategory === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={[styles.chip, { backgroundColor: active ? Brand.primary : colors.backgroundElement }]}>
                    <ThemedText style={active ? styles.chipTextActive : undefined}>{category.name}</ThemedText>
                  </Pressable>
                );
              })}
          </View>
        )}

        <ThemedView type="backgroundElement" style={styles.rowCard}>
          <ThemedText style={styles.flex}>Disponible para pedir</ThemedText>
          <Switch value={isAvailable} onValueChange={setIsAvailable} />
        </ThemedView>

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>{productId ? 'Guardar cambios' : 'Crear producto'}</ThemedText>}
        </Pressable>

        {productId && (
          <Pressable style={styles.deleteButton} onPress={remove}>
            <ThemedText style={styles.buttonText}>Eliminar producto</ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  flex: { flex: 1 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  rowCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14 },
  saveButton: { backgroundColor: Brand.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deleteButton: { backgroundColor: Brand.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: Brand.danger, textAlign: 'center' },
});
