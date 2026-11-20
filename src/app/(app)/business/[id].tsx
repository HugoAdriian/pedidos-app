import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Linking, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchBusinessMenu } from '@/features/businesses/api';
import { cartCount, cartTotal, useCart } from '@/features/cart/store';

export default function BusinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCart((state) => state.items);

  const { data, isLoading, error } = useQuery({
    queryKey: ['business', id],
    queryFn: () => fetchBusinessMenu(id),
    enabled: !!id,
  });

  const sections = (data?.categories ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({
      title: category.name,
      data: category.products.filter((product) => product.is_available),
    }));

  function openInMaps() {
    if (data?.latitude == null || data?.longitude == null) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('No se pudo abrir Google Maps'));
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
          No se pudo cargar el menú: {error instanceof Error ? error.message : ''}
        </ThemedText>
      </ThemedView>
    );
  }

  const hasLocation = data.latitude != null && data.longitude != null;
  const count = cartCount(items);
  const showBar = hasLocation || count > 0;

  return (
    <ThemedView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{data.name}</ThemedText>
            {data.description && <ThemedText>{data.description}</ThemedText>}
            {data.address && <ThemedText type="small">{data.address}</ThemedText>}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="subtitle">{section.title}</ThemedText>
          </ThemedView>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}>
            <ThemedView type="backgroundElement" style={styles.product}>
              <View style={styles.productInfo}>
                <ThemedText style={styles.productName}>{item.name}</ThemedText>
                {item.description && <ThemedText type="small">{item.description}</ThemedText>}
              </View>
              <ThemedText style={styles.price}>${item.price.toFixed(2)}</ThemedText>
            </ThemedView>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        stickySectionHeadersEnabled={false}
      />

      {showBar && (
        <ThemedView style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          {count > 0 && (
            <Pressable style={styles.cartButton} onPress={() => router.push('/cart')}>
              <ThemedText style={styles.buttonText}>
                Ver carrito ({count}) · ${cartTotal(items).toFixed(2)}
              </ThemedText>
            </Pressable>
          )}
          {hasLocation && (
            <Pressable style={styles.mapButton} onPress={openInMaps}>
              <ThemedText style={styles.buttonText}>Cómo llegar en Google Maps</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  header: { gap: 6, paddingVertical: 16 },
  sectionHeader: { paddingTop: 20, paddingBottom: 10 },
  product: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, gap: 12 },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontWeight: '600' },
  price: { fontWeight: '600' },
  separator: { height: 8 },
  error: { color: Brand.danger, textAlign: 'center' },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  cartButton: { backgroundColor: Brand.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  mapButton: { backgroundColor: Brand.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
