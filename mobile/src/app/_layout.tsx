import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Global guard: any authenticated officer with a temporary password is forced to
// the change-password screen, regardless of which route they try to reach
// (tabs, assignment deep-links, notification taps, etc.).
function PasswordGuard({ children }: { children: React.ReactNode }) {
  const { token, user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onChangePassword = segments[segments.length - 1] === 'change-password';
    if (token && user?.must_change_password && !onChangePassword) {
      router.replace('/(auth)/change-password');
    }
  }, [loading, token, user?.must_change_password, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <PasswordGuard>
          <Stack screenOptions={{ headerShown: false }} />
        </PasswordGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}
