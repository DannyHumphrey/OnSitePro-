import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { RootStackParamList, TabParamList } from '@/navigation/types';
import CreateFormScreen from '@/screens/CreateFormScreen';
import DraftsScreen from '@/screens/DraftsScreen';
import FormScreen from '@/screens/FormScreen';
import InboxScreen from '@/screens/InboxScreen';
import LoginScreen from '@/screens/LoginScreen';
import OutboxScreen from '@/screens/OutboxScreen';
import SentScreen from '@/screens/SentScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      initialRouteName="Drafts"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} color={color} name="inbox" />
          ),
        }}
      />
      <Tab.Screen
        name="Drafts"
        component={DraftsScreen}
        options={{
          title: 'Drafts',
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} color={color} name="drafts" />
          ),
        }}
      />
      <Tab.Screen
        name="Outbox"
        component={OutboxScreen}
        options={{
          title: 'Outbox',
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} color={color} name="outbox" />
          ),
        }}
      />
      <Tab.Screen
        name="Sent"
        component={SentScreen}
        options={{
          title: 'Sent',
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} color={color} name="send" />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} color={color} name="settings" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function getTabTitle(route: any) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Drafts';
  switch (routeName) {
    case 'Inbox':
      return 'Inbox';
    case 'Outbox':
      return 'Outbox';
    case 'Sent':
      return 'Sent';
    case 'Settings':
      return 'Settings';
    default:
      return 'Drafts';
  }
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

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isLoggedIn ? 'Tabs' : 'Login'}>
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Tabs"
          component={MainTabs}
          options={({ route }) => ({
            headerShown: true,
            headerTitle: getTabTitle(route),
          })}
        />
        <Stack.Screen name="CreateForm" component={CreateFormScreen} />
        <Stack.Screen name="Form" component={FormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
