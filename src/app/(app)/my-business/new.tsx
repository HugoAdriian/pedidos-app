import { useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { createBusiness } from '@/features/my-business/api';

export default function NewBusinessScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'Para guardar la ubicación de tu cafetería, permite el acceso a la ubicación en los ajustes del teléfono.'
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      Alert.alert('No se pudo obtener la ubicación', 'Revisa que el GPS esté activado e inténtalo de nuevo.');
    } finally {
      setLocating(false);
    }
  }

  async function save() {
    if (!session) return;
    if (!name.trim()) {
      setError('El nombre de la cafetería es obligatorio');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createBusiness({
        owner_id: session.user.id,
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      Alert.alert('¡Listo!', 'Tu cafetería quedó registrada.');
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = [styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput style={inputStyle} placeholder="Nombre de la cafetería *" placeholderTextColor="#888" value={name} onChangeText={setName} />
        <TextInput
          style={[...inputStyle, styles.multiline]}
          placeholder="Descripción (opcional)"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput style={inputStyle} placeholder="Dirección" placeholderTextColor="#888" value={address} onChangeText={setAddress} />
        <TextInput style={inputStyle} placeholder="Teléfono" placeholderTextColor="#888" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <ThemedView type="backgroundElement" style={styles.locationCard}>
          <ThemedText type="subtitle">Ubicación</ThemedText>
          <ThemedText type="small">
            Pulsa el botón estando en tu cafetería, para que los clientes puedan llegar con Google Maps.
          </ThemedText>
          {coords && (
            <ThemedText>
              Ubicación guardada: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </ThemedText>
          )}
          <Pressable style={styles.locationButton} onPress={useCurrentLocation} disabled={locating}>
            {locating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {coords ? 'Actualizar mi ubicación' : 'Usar mi ubicación actual'}
              </ThemedText>
            )}
          </Pressable>
          {coords && (
            <Pressable onPress={() => setCoords(null)}>
              <ThemedText type="small" style={styles.remove}>Quitar ubicación</ThemedText>
            </Pressable>
          )}
        </ThemedView>

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Registrar cafetería</ThemedText>}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  locationCard: { borderRadius: 16, padding: 16, gap: 10 },
  locationButton: { backgroundColor: Brand.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  remove: { color: Brand.danger, textAlign: 'center' },
  saveButton: { backgroundColor: Brand.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: Brand.danger, textAlign: 'center' },
});
