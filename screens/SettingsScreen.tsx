import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { spacing } from '@/constants/styles';
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
                <ThemedView style={styles.logoContainer}>
                    <Image
                      source={require('@/assets/images/C365_Icon.png')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  <ThemedText style={styles.logoText}>C365 OnSite Pro</ThemedText>
                  </ThemedView>
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


const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 50,
    height: 50,
  },
  logoText: {
    fontSize: 28,
    marginTop: 15
  },
  fieldContainer: {
    gap: spacing.sm,
  },
  textInput: {
    marginTop: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(56,69,74,1)',
    borderRadius: 3
  },
  versionText: {
    marginTop: spacing.lg,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});