import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import Constants from 'expo-constants';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { RootStackParamList } from '@/navigation/types';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? 'unknown';

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

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ThemedView
      style={{ flex: 1, padding: 16, justifyContent: 'space-between', alignItems: 'center' }}>
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText type="title" style={{ marginBottom: 16 }}>
          Settings
        </ThemedText>
        <Button mode="outlined" onPress={handleLogout}>Logout</Button>
      </ThemedView>
      <ThemedText style={{ color: '#888' }}>App version {appVersion}</ThemedText>
    </ThemedView>
    </SafeAreaView>
  );
}
