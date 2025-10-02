import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import AuthScreen from "./src/screens/AuthScreen";
import SignUpScreen from "./src/screens/SignUp";
import DashboardScreen from "./src/screens/DashboardScreen";
import ClaimsScreen from "./src/screens/ClaimsScreen";
import AlertsScreen from "./src/screens/AlertsScreen";
import SubmitClaimScreen from "./src/screens/SubmitClaimScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { AlertProvider } from "./src/context/AlertContext";
import { UserProvider } from "./src/context/UserContext";
import { Provider as PaperProvider } from "react-native-paper";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: "#3FA34D" },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#c8e6c9",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "speedometer";
          else if (route.name === "Claims") iconName = "document-text";
          else if (route.name === "Alerts") iconName = "alert-circle";
          else if (route.name === "Profile") iconName = "person";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Claims" component={ClaimsScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Stack Navigator
export default function App() {
  return (
    <PaperProvider>
      <AlertProvider>
        <UserProvider>
          <NavigationContainer theme={AppTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="SignIn" component={AuthScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
              {/* Tabs grouped under Main */}
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="claim-create" component={SubmitClaimScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </UserProvider>
      </AlertProvider>
    </PaperProvider>
  );
}

// Custom Theme
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
  },
};