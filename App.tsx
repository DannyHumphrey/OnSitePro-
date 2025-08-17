import { getValidToken, signOut } from "@/services/authService";
import NetInfo from "@react-native-community/netinfo";
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import jwtDecode from "jwt-decode";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { BottomNavigation, Button, PaperProvider } from "react-native-paper";
import * as SecureStore from "./services/secureStoreWrapper";

import { darkTheme, lightTheme } from "@/constants/theme";
import { FormCountsProvider, useFormCounts } from "@/context/FormCountsContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import type {
  DraftsStackParamList,
  RootStackParamList,
} from "@/navigation/types";
import DraftsScreen from "@/screens/DraftsScreen";
import EmbeddedFormScreen from "@/screens/EmbeddedFormScreen";
import FormBuilderScreen from "@/screens/FormBuilderScreen";
import FormInstanceScreen from "@/screens/FormInstanceScreen";
import FormScreen from "@/screens/FormScreen";
import LoginScreen from "@/screens/LoginScreen";
import MyTasksScreen from "@/screens/MyTasksScreen";
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
    { key: "tasks", title: "Inbox", focusedIcon: "clipboard-check" },
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
    drafts: DraftsTabNavigator,
    tasks: MyTasksScreen,
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
  useOfflineSync();

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

  const linking = {
    prefixes: [Linking.createURL('/')],
    config: {
      screens: {
        EmbeddedFormScreen: 'embedded-form',
        FormBuilderScreen: 'form-builder',
      },
    },
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
          linking={linking}
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
              name="FormScreen"
              component={FormScreen}
              options={{ title: "Form" }}
            />
            <RootStack.Screen
              name="EmbeddedFormScreen"
              component={EmbeddedFormScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="FormBuilderScreen"
              component={FormBuilderScreen}
              options={{ title: "Form Builder" }}
            />
            <RootStack.Screen
              name="FormInstance"
              component={FormInstanceScreen}
              options={{ headerShown: false }}
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
