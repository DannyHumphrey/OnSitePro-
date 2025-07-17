import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Checkbox, TextInput } from 'react-native-paper';

import { spacing } from '@/constants/styles';
import {
  clearUsername,
  getSavedUsername,
  saveToken,
  saveUsername,
} from '@/services/authService';
import { RootStackParamList } from '@/navigation/types';

type Props = { onLogin: () => void };

export default function LoginScreen({ onLogin }: Props) {
  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? 'unknown';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    getSavedUsername().then((name) => {
      if (name) {
        setUsername(name);
        setRememberMe(true);
      }
    });
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch(
        'https://uat.onsite-lite.co.uk/api/Authentication/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Username: username,
            Password: password,
            ResetCode: '',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = (await response.json()) as { token?: string };

      if (data.token) {
        await saveToken(data.token);
        if (rememberMe) {
          await saveUsername(username);
        } else {
          await clearUsername();
        }
        onLogin();
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Invalid Login', 'Username or password is incorrect.');
      }
    } catch (error) {
      Alert.alert('Login Failed', 'An unexpected error occurred.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/C365_Icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          <Text style={styles.logoText}>C365 OnSite Pro</Text>
          </View>
          <View style={styles.fieldContainer}>
            <TextInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              style={styles.textInput}
              autoCapitalize="none"
              mode='outlined'
              label="Username"
            />
          </View>
          <View style={styles.fieldContainer}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.textInput}
            mode='outlined'
            label='Password'
          />
        </View>
        <View style={styles.rememberContainer}>
          <Checkbox
            status={rememberMe ? 'checked' : 'unchecked'}
            onPress={() => setRememberMe(!rememberMe)}
          />
          <Text>Remember Me</Text>
        </View>
        <Button mode="contained" onPress={handleLogin} style={styles.button}>
          Log In
        </Button>
          <Text style={styles.versionText}>© {new Date().getFullYear()} C365 Cloud all rights reserved</Text>
          <Text style={styles.versionText}>v{appVersion}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    width: 120,
    height: 120,
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
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  versionText: {
    marginTop: spacing.lg,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});
