import React, { useState, useRef } from "react";
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
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import * as NavigationBar from "expo-navigation-bar";

export default function WelcomeScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current; // for shake

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleGetStarted = async () => {
    if (username.trim().length === 0) {
      setError(true);
      triggerShake();
      return;
    }
    setError(false);
    await AsyncStorage.setItem("hasLaunched", "true");
    await AsyncStorage.setItem("username", username.trim());
    navigation.replace("Main");
  };

  if (Platform.OS === "android") {
    NavigationBar.setBackgroundColorAsync("#f8f9fa");
    NavigationBar.setButtonStyleAsync("dark");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
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
          Organize your tasks efficiently, set reminders, and never miss a deadline!
        </Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: "100%" }}>
          <TextInput
            style={[styles.input, error && { borderColor: "tomato" }]}
            placeholder="Enter your name"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
          />
        </Animated.View>

        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa", paddingBottom: 20 },
  image: { width: 350, height: 350 },
  title: { fontSize: 28, fontFamily: "Poppins_700Bold", marginBottom: 12, textAlign: "center" },
  description: { fontSize: 16, fontFamily: "Poppins_400Regular", color: "#555", textAlign: "center", marginBottom: 25, paddingHorizontal: 10 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 24, fontFamily: "Poppins_400Regular", fontSize: 16, backgroundColor: "#fff" },
  button: { backgroundColor: "tomato", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10 },
  buttonText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 16 },
});
