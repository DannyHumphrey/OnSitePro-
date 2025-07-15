import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import Constants from 'expo-constants';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { RootStackParamList } from '@/navigation/types';
import {
  getFormTemplatesRefreshDate,
  refreshFormTemplates,
} from '@/services/formTemplateService';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? 'unknown';
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    getFormTemplatesRefreshDate().then(setLastRefresh);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('auth:isLoggedIn');
          await AsyncStorage.removeItem('auth:token');
          navigation.replace('Login');
        },
      },
    ]);
  };

  const handleRefreshTemplates = async () => {
    try {
      await refreshFormTemplates();
      const ts = await getFormTemplatesRefreshDate();
      setLastRefresh(ts);
      Alert.alert('Success', 'Form types refreshed');
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh form types');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ThemedView
      style={{ flex: 1, padding: 16, justifyContent: 'space-between', alignItems: 'center' }}>
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText type="title" style={{ marginBottom: 16 }}>
          Settings
        </ThemedText>
        <ThemedText style={{ marginBottom: 8 }}>
          Form types last refreshed:{' '}
          {lastRefresh ? lastRefresh.toLocaleString() : 'never'}
        </ThemedText>
        <Button mode="outlined" style={{ marginBottom: 24 }} onPress={handleRefreshTemplates}>
          Refresh Form Types
        </Button>
        <Button mode="outlined" onPress={handleLogout}>Logout</Button>
      </ThemedView>
      <ThemedText style={{ color: '#888' }}>App version {appVersion}</ThemedText>
    </ThemedView>
    </SafeAreaView>
  );
}
