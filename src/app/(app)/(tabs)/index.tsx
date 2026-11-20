import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Business, fetchBusinesses } from '@/features/businesses/api';

function BusinessCard({ business }: { business: Business }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/business/[id]', params: { id: business.id } })}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.cardTitle}>{business.name}</ThemedText>
          <View style={[styles.badge, { backgroundColor: business.is_open ? '#2e7d32' : '#757575' }]}>
            <ThemedText style={styles.badgeText}>{business.is_open ? 'Abierto' : 'Cerrado'}</ThemedText>
          </View>
        </View>
        {business.description && <ThemedText>{business.description}</ThemedText>}
        {business.address && <ThemedText type="small">{business.address}</ThemedText>}
      </ThemedView>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['businesses'],
    queryFn: fetchBusinesses,
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>Negocios</ThemedText>

        {isLoading ? (
          <ActivityIndicator style={styles.center} />
        ) : error ? (
          <ThemedText style={styles.error}>
            No se pudieron cargar los negocios: {error instanceof Error ? error.message : ''}
          </ThemedText>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BusinessCard business={item} />}
            contentContainerStyle={styles.list}
            refreshing={isRefetching}
            onRefresh={refetch}
            ListEmptyComponent={
              <ThemedText style={styles.empty}>Todavía no hay negocios disponibles</ThemedText>
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
  error: { color: '#d32f2f', textAlign: 'center', marginTop: 24 },
  empty: { textAlign: 'center', marginTop: 40 },
});
