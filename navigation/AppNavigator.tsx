import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import FormScreen from '@/screens/FormScreen';
import InboxScreen from '@/screens/InboxScreen';
import DraftsScreen from '@/screens/DraftsScreen';
import OutboxScreen from '@/screens/OutboxScreen';
import SentScreen from '@/screens/SentScreen';
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
  Tabs: undefined;
  Form: { schema: FormSchema };
};

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

export default function AppNavigator() {
  const colorScheme = useColorScheme();
  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Tabs">
        <Stack.Screen name="Tabs" component={MainTabs} />
        <Stack.Screen name="Form" component={FormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
