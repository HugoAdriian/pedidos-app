import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchProduct, ProductOptionGroup } from '@/features/businesses/api';
import { useCart } from '@/features/cart/store';

const sortedOptions = (group: ProductOptionGroup) =>
  group.options.slice().sort((a, b) => a.price_delta - b.price_delta);

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addItem = useCart((state) => state.addItem);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });

  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  // Preselecciona la primera opción de los grupos obligatorios de elección única
  useEffect(() => {
    if (!data) return;
    const defaults: Record<string, string[]> = {};
    for (const group of data.option_groups) {
      if (group.required && group.max_select === 1 && group.options.length > 0) {
        defaults[group.id] = [sortedOptions(group)[0].id];
      }
    }
    setSelected(defaults);
  }, [data]);

  function toggleOption(group: ProductOptionGroup, optionId: string) {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      if (group.max_select === 1) {
        if (current.includes(optionId)) {
          return group.required ? prev : { ...prev, [group.id]: [] };
        }
        return { ...prev, [group.id]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [group.id]: current.filter((o) => o !== optionId) };
      }
      if (current.length >= group.max_select) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
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
          No se pudo cargar el producto: {error instanceof Error ? error.message : ''}
        </ThemedText>
      </ThemedView>
    );
  }

  const chosen = data.option_groups.flatMap((group) =>
    group.options.filter((option) => selected[group.id]?.includes(option.id))
  );
  const unitPrice = data.price + chosen.reduce((sum, option) => sum + option.price_delta, 0);

  function submit() {
    if (!data) return;

    const missing = data.option_groups.find(
      (group) => group.required && (selected[group.id]?.length ?? 0) === 0
    );
    if (missing) {
      Alert.alert('Falta elegir', `Selecciona una opción en "${missing.name}"`);
      return;
    }

    const business = { id: data.business_id, name: data.businesses.name };

    const add = () => {
      addItem(business, {
        productId: data.id,
        name: data.name,
        unitPrice,
        quantity,
        options: chosen.map((o) => ({ id: o.id, name: o.name, priceDelta: o.price_delta })),
      });
      router.back();
    };

    const cart = useCart.getState();
    if (cart.items.length > 0 && cart.businessId !== business.id) {
      Alert.alert(
        '¿Empezar un pedido nuevo?',
        `Tu carrito tiene productos de ${cart.businessName}. Si continúas, se vaciará.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: add },
        ]
      );
    } else {
      add();
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">{data.name}</ThemedText>
        {data.description && <ThemedText>{data.description}</ThemedText>}
        <ThemedText type="subtitle">${data.price.toFixed(2)}</ThemedText>

        {data.option_groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <ThemedText type="subtitle">
              {group.name}
              {group.required ? ' (obligatorio)' : ''}
            </ThemedText>
            {sortedOptions(group).map((option) => {
              const isSelected = selected[group.id]?.includes(option.id) ?? false;
              const marker = group.max_select === 1 ? (isSelected ? '●' : '○') : isSelected ? '■' : '□';
              return (
                <Pressable key={option.id} onPress={() => toggleOption(group, option.id)}>
                  <ThemedView type="backgroundElement" style={styles.option}>
                    <ThemedText>{marker}  {option.name}</ThemedText>
                    {option.price_delta > 0 && (
                      <ThemedText type="small">+${option.price_delta.toFixed(2)}</ThemedText>
                    )}
                  </ThemedView>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <ThemedView style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.stepper}>
          <Pressable style={styles.stepButton} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
            <ThemedText style={styles.stepText}>−</ThemedText>
          </Pressable>
          <ThemedText style={styles.quantity}>{quantity}</ThemedText>
          <Pressable style={styles.stepButton} onPress={() => setQuantity((q) => Math.min(20, q + 1))}>
            <ThemedText style={styles.stepText}>+</ThemedText>
          </Pressable>
        </View>
        <Pressable style={styles.addButton} onPress={submit}>
          <ThemedText style={styles.addText}>Agregar · ${(unitPrice * quantity).toFixed(2)}</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { padding: 20, gap: 10, paddingBottom: 32 },
  group: { gap: 8, marginTop: 16 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 14 },
  error: { color: '#d32f2f', textAlign: 'center' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#757575', alignItems: 'center', justifyContent: 'center' },
  stepText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  quantity: { minWidth: 28, textAlign: 'center', fontWeight: '600' },
  addButton: { flex: 1, backgroundColor: '#2e7d32', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: '600' },
});
