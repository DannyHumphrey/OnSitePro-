import { getValidToken, signOut } from "@/services/authService";
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, Modal, StyleSheet, Text } from "react-native";
import { BottomNavigation, PaperProvider, Button } from "react-native-paper";
import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from "expo-secure-store";
import jwtDecode from "jwt-decode";

import { darkTheme, lightTheme } from "@/constants/theme";
import { FormCountsProvider, useFormCounts } from "@/context/FormCountsContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import type {
  DraftsStackParamList,
  RootStackParamList,
} from "@/navigation/types";
import CreateFormScreen from "@/screens/CreateFormScreen";
import DraftsScreen from "@/screens/DraftsScreen";
import FormScreen from "@/screens/FormScreen";
import InboxScreen from "@/screens/InboxScreen";
import LoginScreen from "@/screens/LoginScreen";
import OutboxScreen from "@/screens/OutboxScreen";
import SentScreen from "@/screens/SentScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { cleanupOldSentForms } from "@/services/sentService";

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
    </DraftsStack.Navigator>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 24,
    borderRadius: 4,
    alignItems: 'center',
    width: '80%',
  },
  modalText: {
    textAlign: 'center',
  },
});

function MainTabNavigator() {
  const { counts } = useFormCounts();
  const [index, setIndex] = useState(0);
  const routes = [
    { key: "inbox", title: "Inbox", focusedIcon: "inbox", badge: counts.inbox },
    {
      key: "drafts",
      title: "Drafts",
      focusedIcon: "application-edit",
      badge: counts.drafts,
    },
    {
      key: "outbox",
      title: "Outbox",
      focusedIcon: "archive-sync",
      badge: counts.outbox,
    },
    { key: "sent", title: "Sent", focusedIcon: "send", badge: counts.sent },
    { key: "settings", title: "Settings", focusedIcon: "application-cog" },
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
  const [sessionExpired, setSessionExpired] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    async function loadStatus() {
      try {
        const token = await getValidToken();
        setIsLoggedIn(!!token);
      } catch {
        setIsLoggedIn(false);
      }
    }
    loadStatus();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      if (online && wasOffline.current) {
        const token = await SecureStore.getItemAsync("auth:token");
        if (token) {
          try {
            const { exp } = jwtDecode<{ exp: number }>(token);
            if (typeof exp === "number" && exp * 1000 <= Date.now()) {
              setSessionExpired(true);
            }
          } catch {
            setSessionExpired(true);
          }
        }
      }
      wasOffline.current = !online;
    });
    return () => unsubscribe();
  }, []);

  const handleSessionExpired = async () => {
    await signOut();
    setSessionExpired(false);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    cleanupOldSentForms()
      .then((count) => {
        if (count > 0) {
          console.log(`Cleaned up ${count} old sent forms`);
        }
      })
      .catch((err) => console.log("Cleanup error:", err));
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  const paperTheme = colorScheme === "dark" ? darkTheme : lightTheme;
  const navigationTheme =
    colorScheme === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;
  return (
    <FormCountsProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer
          key={isLoggedIn ? "logged-in" : "logged-out"}
          theme={{
            ...navigationTheme,
            colors: {
              ...navigationTheme.colors,
              background: paperTheme.colors.background,
            },
          }}
        >
          <RootStack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={isLoggedIn ? "MainTabs" : "Login"}
          >
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
            <RootStack.Screen
              name="CreateFormScreen"
              component={CreateFormScreen}
              options={{ title: "Create Form" }}
            />
            <RootStack.Screen
              name="FormScreen"
              component={FormScreen}
              options={{ title: "Form" }}
            />
          </RootStack.Navigator>
          <Modal transparent visible={sessionExpired} animationType="fade">
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: paperTheme.colors.background },
                ]}
              >
                <Text style={styles.modalText}>
                  Session expired. Please log in again
                </Text>
                <Button mode="contained" onPress={handleSessionExpired} style={{marginTop:16}}>
                  Login
                </Button>
              </View>
            </View>
          </Modal>
        </NavigationContainer>
      </PaperProvider>
    </FormCountsProvider>
  );
}
