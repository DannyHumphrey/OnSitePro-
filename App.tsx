import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type {
  DraftsStackParamList,
  MainTabParamList,
  RootStackParamList,
} from '@/navigation/types';
import CreateFormScreen from '@/screens/CreateFormScreen';
import DraftsScreen from '@/screens/DraftsScreen';
import FormScreen from '@/screens/FormScreen';
import InboxScreen from '@/screens/InboxScreen';
import LoginScreen from '@/screens/LoginScreen';
import OutboxScreen from '@/screens/OutboxScreen';
import SentScreen from '@/screens/SentScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
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
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      initialRouteName="DraftsTab"
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
        name="InboxTab"
        component={InboxScreen}
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} color={color} name="inbox" />
          ),
        }}
      />
      <Tab.Screen
        name="DraftsTab"
        component={DraftsTabNavigator}
        options={{
          title: 'Drafts',
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} color={color} name="drafts" />
          ),
        }}
      />
      <Tab.Screen
        name="OutboxTab"
        component={OutboxScreen}
        options={{
          title: 'Outbox',
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} color={color} name="outbox" />
          ),
        }}
      />
      <Tab.Screen
        name="SentTab"
        component={SentScreen}
        options={{
          title: 'Sent',
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} color={color} name="send" />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
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
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'DraftsTab';
  switch (routeName) {
    case 'InboxTab':
      return 'Inbox';
    case 'OutboxTab':
      return 'Outbox';
    case 'SentTab':
      return 'Sent';
    case 'SettingsTab':
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
          options={({ route }) => ({
            headerShown: true,
            headerTitle: getTabTitle(route),
          })}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
