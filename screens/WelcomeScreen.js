import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import * as NavigationBar from "expo-navigation-bar"; // 👈 Android nav bar color control

export default function WelcomeScreen({ navigation }) {
  const [username, setUsername] = useState("");

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleGetStarted = async () => {
    if (username.trim().length === 0) return alert("Please enter your name");

    await AsyncStorage.setItem("hasLaunched", "true");
    await AsyncStorage.setItem("username", username.trim());
    navigation.replace("Main");
  };

  // 👇 Navigation bar fix for 3-button phones
  if (Platform.OS === "android") {
    NavigationBar.setBackgroundColorAsync("#f8f9fa"); // same as screen bg
    NavigationBar.setButtonStyleAsync("dark"); // dark buttons for visibility
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor="#f8f9fa" // same as screen background
        barStyle="dark-content" // dark icons (time, battery, etc.)
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Image
          source={require("../assets/welcome.png")}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>Welcome to Task Manager</Text>
        <Text style={styles.description}>
          Organize your tasks efficiently, set reminders, and never miss a
          deadline!
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />

        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingBottom: 20, // 👈 extra padding for 3-button nav overlap
  },
  image: {
    width: 350,
    height: 350,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "tomato",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
});
