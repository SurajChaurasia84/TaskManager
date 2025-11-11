import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initNotifications, setNavigationRef } from "./notificationHelper"; // ✅ import helper

// App info
import pkg from "./package.json";

// Screens
import HomeScreen from "./screens/HomeScreen";
import AddTaskScreen from "./screens/AddTaskScreen";
import AllTaskScreen from "./screens/AllTaskScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import TaskViewScreen from "./screens/TaskViewScreen";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Custom Drawer Content
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ height: 20 }} />
      <DrawerItemList {...props} />
      <View style={styles.footer}>
        <Text style={styles.copyText}>
          {pkg.name} © {new Date().getFullYear()}
        </Text>
        <Text style={styles.versionText}>v{pkg.version}</Text>
      </View>
    </DrawerContentScrollView>
  );
}

// Drawer Navigator
function DrawerNavigator() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: "#f5f6fa", width: 240 },
        drawerLabelStyle: { fontFamily: "Poppins_600SemiBold", fontSize: 16 },
        drawerActiveTintColor: "tomato",
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="All Tasks"
        component={AllTaskScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigationRef = useNavigationContainerRef();


  useEffect(() => {
    setNavigationRef(navigationRef); // 👈 give reference to helper
    initNotifications(); // initialize
  }, []);


  // 🎬 Check first-time launch
  useEffect(() => {
    const checkWelcome = async () => {
      try {
        const launched = await AsyncStorage.getItem("hasLaunched");
        setShowWelcome(launched !== "true");
      } catch (e) {
        console.log("AsyncStorage error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkWelcome();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {showWelcome && <Stack.Screen name="Welcome" component={WelcomeScreen} />}
          <Stack.Screen name="Main" component={DrawerNavigator} />
          <Stack.Screen name="AddTask" component={AddTaskScreen} />
          <Stack.Screen name="TaskView" component={TaskViewScreen} />
          <Stack.Screen name="AllTask" component={AllTaskScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  footer: {
    marginTop: "auto",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    alignItems: "center",
  },
  copyText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Poppins_600SemiBold",
  },
  versionText: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
});
