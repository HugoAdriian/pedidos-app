import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/features/auth/AuthContext';

export default function AppLayout() {
  const { session } = useAuth();

  if (!session) return <Redirect href="/login" />;

  return <AppTabs />;
}
