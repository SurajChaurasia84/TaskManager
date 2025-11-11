import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  Switch,
  Animated,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { scheduleTaskNotification } from "../notificationHelper"; // ✅ Import helper
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

// 🟢 Configure how in-app notifications appear
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function AddTaskScreen({ navigation, route }) {
  const { tasks, saveTasks } = route.params;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [dueDateTime, setDueDateTime] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");
  const [reminder, setReminder] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // 🧠 Load fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // 🔔 Request permission once
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === "granted");
    })();
  }, []);

  // 🧩 Wait for fonts
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "Images",
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // 🧠 Add Task
  const handleAddTask = async () => {
    if (title.trim().length === 0) {
      triggerShake();
      return;
    }

    const currentDateTime = new Date();
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      image,
      dueDateTime: dueDateTime
        ? dueDateTime.toISOString()
        : currentDateTime.toISOString(),
      completed: false,
      reminder,
    };

    // 🧠 Save locally
    saveTasks([newTask, ...tasks]);

    // 🔔 Schedule notification if reminder is ON
    if (reminder && dueDateTime) {
      if (!notificationPermission) {
        Alert.alert("Permission required", "Enable notifications to get reminders.");
      } else {
        await scheduleTaskNotification(newTask); // ✅ Call helper instead of inline code
      }
    }

    navigation.goBack();
  };

  const showMode = (mode) => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const onDateTimeChange = (event, selected) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }
    setShowPicker(Platform.OS === "ios");
    if (selected) {
      if (!dueDateTime) {
        setDueDateTime(selected);
      } else {
        const current = new Date(dueDateTime);
        if (pickerMode === "date") {
          current.setFullYear(selected.getFullYear());
          current.setMonth(selected.getMonth());
          current.setDate(selected.getDate());
        } else {
          current.setHours(selected.getHours());
          current.setMinutes(selected.getMinutes());
        }
        setDueDateTime(current);
      }
    }
  };

  const handleReminderToggle = (value) => {
    setReminder(value);
    if (value) {
      Alert.alert("Set Reminder", "Please choose a date and time.", [
        { text: "OK", onPress: () => showMode("date") },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      <Text style={styles.heading}>Add New Task</Text>

      <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: "100%" }}>
        <TextInput
          style={styles.input}
          placeholder="Task title*"
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
        />
      </Animated.View>

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Task description"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <Ionicons name="image-outline" size={50} color="#555" />
        )}
        <Text style={styles.imageText}>Pick Image (optional)</Text>
      </TouchableOpacity>

      <View style={styles.dateTimeRow}>
        <TouchableOpacity style={styles.datePicker} onPress={() => showMode("date")}>
          <Ionicons name="calendar-outline" size={24} color="#555" style={{ marginRight: 8 }} />
          <Text style={styles.dateText}>
            {dueDateTime ? dueDateTime.toLocaleDateString() : "Pick Date"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.datePicker} onPress={() => showMode("time")}>
          <Ionicons name="time-outline" size={24} color="#555" style={{ marginRight: 8 }} />
          <Text style={styles.dateText}>
            {dueDateTime
              ? dueDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Pick Time"}
          </Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={dueDateTime || new Date()}
          mode={pickerMode}
          display="default"
          onChange={onDateTimeChange}
        />
      )}

      <View style={styles.reminderRow}>
        <Text style={styles.reminderText}>Set Reminder</Text>
        <Switch value={reminder} onValueChange={handleReminderToggle} />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
        <Text style={styles.addButtonText}>Add Task</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  heading: { fontSize: 26, fontFamily: "Poppins_700Bold", marginBottom: 20 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontFamily: "Poppins_400Regular",
  },
  imagePicker: { justifyContent: "center", alignItems: "center", marginBottom: 20 },
  imagePreview: { width: 100, height: 100, borderRadius: 10 },
  imageText: { marginTop: 5, fontFamily: "Poppins_400Regular" },
  dateTimeRow: { flexDirection: "row", justifyContent: "space-between" },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    flex: 1,
    marginRight: 8,
  },
  dateText: { fontFamily: "Poppins_400Regular" },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  reminderText: { fontFamily: "Poppins_400Regular", fontSize: 16 },
  addButton: {
    backgroundColor: "tomato",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontFamily: "Poppins_600SemiBold" },
  cancelButton: { alignItems: "center", paddingVertical: 10 },
  cancelText: { fontFamily: "Poppins_400Regular", fontSize: 16 },
});
