import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';

export default function AppLayout() {
  const { session } = useAuth();

  if (!session) return <Redirect href="/login" />;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="business/[id]" options={{ title: 'Menú', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Producto', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="cart" options={{ title: 'Mi carrito', headerBackTitle: 'Atrás' }} />
    </Stack>
  );
}
