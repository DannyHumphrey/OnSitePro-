import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { BottomNavigation, PaperProvider } from 'react-native-paper';

import { darkTheme, lightTheme } from '@/constants/theme';
import { FormCountsProvider, useFormCounts } from '@/context/FormCountsContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { DraftsStackParamList, RootStackParamList } from '@/navigation/types';
import CreateFormScreen from '@/screens/CreateFormScreen';
import DraftsScreen from '@/screens/DraftsScreen';
import FormScreen from '@/screens/FormScreen';
import InboxScreen from '@/screens/InboxScreen';
import LoginScreen from '@/screens/LoginScreen';
import OutboxScreen from '@/screens/OutboxScreen';
import SentScreen from '@/screens/SentScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { cleanupOldSentForms } from '@/services/sentService';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const DraftsStack = createNativeStackNavigator<DraftsStackParamList>();

function DraftsTabNavigator() {
  return (
    <DraftsStack.Navigator>
      <DraftsStack.Screen
        name="DraftsScreen"
        component={DraftsScreen}
        options={{ headerShown: false }}
      />
      <DraftsStack.Screen
        name="CreateFormScreen"
        component={CreateFormScreen}
        options={{ title: 'Create Form' }}
      />
      <DraftsStack.Screen name="FormScreen" component={FormScreen} options={{ title: 'Form' }} />
    </DraftsStack.Navigator>
  );
}

function MainTabNavigator() {
  const { counts } = useFormCounts();
  const [index, setIndex] = useState(0);
  const routes = [
    { key: 'inbox', title: 'Inbox', focusedIcon: 'inbox', badge: counts.inbox },
    {
      key: 'drafts',
      title: 'Drafts',
      focusedIcon: 'application-edit',
      badge: counts.drafts,
    },
    {
      key: 'outbox',
      title: 'Outbox',
      focusedIcon: 'archive-sync',
      badge: counts.outbox,
    },
    { key: 'sent', title: 'Sent', focusedIcon: 'send', badge: counts.sent },
    { key: 'settings', title: 'Settings', focusedIcon: 'application-cog' },
  ];

  const renderScene = BottomNavigation.SceneMap({
    inbox: InboxScreen,
    drafts: DraftsTabNavigator,
    outbox: OutboxScreen,
    sent: SentScreen,
    settings: SettingsScreen,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      safeAreaInsets={{ bottom: 0 }}
    />
  );
}


export default function App() {
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const value = await AsyncStorage.getItem('auth:isLoggedIn');
        setIsLoggedIn(value === 'true');
      } catch {
        setIsLoggedIn(false);
      }
    }
    loadStatus();
  }, []);

  useEffect(() => {
    cleanupOldSentForms()
      .then((count) => {
        if (count > 0) {
          console.log(`Cleaned up ${count} old sent forms`);
        }
      })
      .catch((err) => console.log('Cleanup error:', err));
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  const paperTheme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const navigationTheme = colorScheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
  return (
    <FormCountsProvider>
      <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={{...navigationTheme, colors: { ...navigationTheme.colors, background: paperTheme.colors.background }}}>
        <RootStack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={isLoggedIn ? 'MainTabs' : 'Login'}>
        <RootStack.Screen name="Login">
          {(props) => (
            <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />
          )}
        </RootStack.Screen>
        <RootStack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
    </PaperProvider>
    </FormCountsProvider>
  );
}
