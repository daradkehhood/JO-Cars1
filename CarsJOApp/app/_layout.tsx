import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '../store/authStore';

function SplashLoading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 16 }}>جاري التحميل...</Text>
    </View>
  );
}

export default function RootLayout() {
  const { hydrate, isHydrated } = useAuthStore();

  useEffect(() => {
    try {
      hydrate();
    } catch (e) {
      console.warn('Hydrate error:', e);
    }
  }, []);

  if (!isHydrated) {
    return <SplashLoading />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/register" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="cars/[id]" />
        <Stack.Screen name="cars/add" />
        <Stack.Screen name="cars/compare" />
        <Stack.Screen name="cars/search" />
        <Stack.Screen name="parts/[id]" />
        <Stack.Screen name="parts/add" />
        <Stack.Screen name="plates/[id]" />
        <Stack.Screen name="plates/add" />
        <Stack.Screen name="wanted/[id]" />
        <Stack.Screen name="wanted/add" />
        <Stack.Screen name="forum/[slug]" />
        <Stack.Screen name="forum/topic/[slug]" />
        <Stack.Screen name="news/[slug]" />
        <Stack.Screen name="profile/[id]" />
        <Stack.Screen name="tickets/[id]" />
        <Stack.Screen name="maintenance/add" />
      </Stack>
    </>
  );
}
