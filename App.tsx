import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

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

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const INITIAL_ROUTE_NAME = 'Login';

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
    default:
      return 'Drafts';
  }
}

export default function App() {
  const colorScheme = useColorScheme();
  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={INITIAL_ROUTE_NAME}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
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
