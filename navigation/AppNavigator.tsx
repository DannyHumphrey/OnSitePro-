import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from '@/hooks/useColorScheme';
import DashboardScreen from '@/screens/DashboardScreen';
import FormScreen from '@/screens/FormScreen';
import InboxScreen from '@/screens/InboxScreen';
import DraftsScreen from '@/screens/DraftsScreen';
import OutboxScreen from '@/screens/OutboxScreen';
import SentScreen from '@/screens/SentScreen';

import type { FormSchema } from '@/components/FormRenderer';

export type RootStackParamList = {
  Dashboard: undefined;
  Form: { schema: FormSchema };
  Inbox: undefined;
  Drafts: undefined;
  Outbox: undefined;
  Sent: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const colorScheme = useColorScheme();
  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName="Dashboard">
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Form" component={FormScreen} />
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="Drafts" component={DraftsScreen} />
        <Stack.Screen name="Outbox" component={OutboxScreen} />
        <Stack.Screen name="Sent" component={SentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
