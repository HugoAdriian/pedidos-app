import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchMyBusinesses } from '@/features/my-business/api';
import { supabase } from '@/lib/supabase';

type Profile = { full_name: string; role: string };

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setProfile(data);
      });
  }, [userId]);

  const { data: myBusinesses, isLoading: loadingBusinesses } = useQuery({
    queryKey: ['my-businesses', userId],
    queryFn: () => fetchMyBusinesses(userId!),
    enabled: !!userId,
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title" style={styles.title}>Mi perfil</ThemedText>

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small">Nombre</ThemedText>
            <ThemedText>{profile?.full_name ?? '...'}</ThemedText>

            <ThemedText type="small" style={styles.label}>Correo</ThemedText>
            <ThemedText>{session?.user.email}</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Mis cafeterías</ThemedText>

            {loadingBusinesses ? (
              <ThemedText type="small">Cargando...</ThemedText>
            ) : myBusinesses && myBusinesses.length > 0 ? (
              myBusinesses.map((business) => (
                <View key={business.id} style={styles.businessRow}>
                  <View style={styles.flex}>
                    <ThemedText style={styles.bold}>{business.name}</ThemedText>
                    <ThemedText type="small">{business.is_open ? 'Abierta' : 'Cerrada'}</ThemedText>
                  </View>
                  <Pressable
                    style={styles.manageButton}
                    onPress={() => router.push({ pathname: '/my-business/[id]', params: { id: business.id } })}>
                    <ThemedText style={styles.buttonText}>Administrar menú</ThemedText>
                  </Pressable>
                </View>
              ))
            ) : (
              <ThemedText type="small">
                Registra tu cafetería para publicar tu menú y recibir pedidos.
              </ThemedText>
            )}

            <Pressable style={styles.primaryButton} onPress={() => router.push('/my-business/new')}>
              <ThemedText style={styles.buttonText}>Registrar una cafetería</ThemedText>
            </Pressable>
          </ThemedView>

          <Pressable style={styles.logoutButton} onPress={signOut}>
            <ThemedText style={styles.buttonText}>Cerrar sesión</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, gap: 16 },
  title: { textAlign: 'center' },
  card: { borderRadius: 16, padding: 20, gap: 8 },
  label: { marginTop: 8 },
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  businessRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  error: { color: Brand.danger, textAlign: 'center' },
  manageButton: { backgroundColor: Brand.accent, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  primaryButton: { backgroundColor: Brand.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  logoutButton: { backgroundColor: Brand.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
