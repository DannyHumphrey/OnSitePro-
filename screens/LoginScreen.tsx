import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RootStackParamList } from '@/navigation/types';

type Props = { onLogin: () => void };

export default function LoginScreen({ onLogin }: Props) {
  const colorScheme = useColorScheme() ?? 'light';

  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? 'unknown';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
        await AsyncStorage.setItem('auth:token', data.token);
        await AsyncStorage.setItem('auth:isLoggedIn', 'true');
        onLogin();
        navigation.replace('Tabs');
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
          <View style={styles.fieldContainer}>
            <TextInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              style={styles.textInput}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.fieldContainer}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.textInput}
            />
          </View>
          <Button
            title="Login"
            onPress={handleLogin}
            color={Colors[colorScheme].tint}
          />
          <Text style={styles.versionText}>v{appVersion}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  fieldContainer: {
    gap: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
  versionText: {
    marginTop: 32,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});
