import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { useOrdersRealtime } from '@/features/orders/useOrdersRealtime';

export default function AppLayout() {
  const { session } = useAuth();
  useOrdersRealtime(session?.user.id);

  if (!session) return <Redirect href="/login" />;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="business/[id]" options={{ title: 'Menú', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Producto', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="cart" options={{ title: 'Mi carrito', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="my-business/new" options={{ title: 'Registrar cafetería', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="my-business/[id]" options={{ title: 'Mi cafetería', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="my-business/product-form" options={{ title: 'Producto', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="my-business/orders" options={{ title: 'Pedidos recibidos', headerBackTitle: 'Atrás' }} />
    </Stack>
  );
}
