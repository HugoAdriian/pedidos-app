import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';

type Profile = { full_name: string; role: string };

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setProfile(data);
      });
  }, [session]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="title" style={styles.title}>Mi perfil</ThemedText>

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="small">Nombre</ThemedText>
          <ThemedText>{profile?.full_name ?? '...'}</ThemedText>

          <ThemedText type="small" style={styles.label}>Correo</ThemedText>
          <ThemedText>{session?.user.email}</ThemedText>

          <ThemedText type="small" style={styles.label}>Tipo de cuenta</ThemedText>
          <ThemedText>{profile?.role ?? '...'}</ThemedText>
        </ThemedView>

        <Pressable style={styles.button} onPress={signOut}>
          <ThemedText style={styles.buttonText}>Cerrar sesión</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 16 },
  title: { textAlign: 'center' },
  card: { borderRadius: 16, padding: 20, gap: 4 },
  label: { marginTop: 12 },
  error: { color: '#d32f2f', textAlign: 'center' },
  button: { backgroundColor: '#c62828', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
