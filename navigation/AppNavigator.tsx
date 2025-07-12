import { DarkTheme, DefaultTheme, NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import FormScreen from '@/screens/FormScreen';
import CreateFormScreen from '@/screens/CreateFormScreen';
import InboxScreen from '@/screens/InboxScreen';
import DraftsScreen from '@/screens/DraftsScreen';
import OutboxScreen from '@/screens/OutboxScreen';
import SentScreen from '@/screens/SentScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import { Colors } from '@/constants/Colors';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

import type { FormSchema } from '@/components/FormRenderer';

export type TabParamList = {
  Drafts: undefined;
  Inbox: undefined;
  Outbox: undefined;
  Sent: undefined;
};

export type RootStackParamList = {
  Dashboard: undefined;
  Tabs: { screen?: keyof TabParamList } | undefined;
  CreateForm: undefined;
  Form: {
    schema: FormSchema;
    formType?: string;
    formName?: string;
    data?: Record<string, any>;
    draftId?: string;
  };
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
/**
 * The name of the first screen shown when the app starts.
 */
const INITIAL_ROUTE_NAME = 'Dashboard';

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

export default function AppNavigator() {
  const colorScheme = useColorScheme();
  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Start the app on the Dashboard screen */}
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={INITIAL_ROUTE_NAME}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
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
