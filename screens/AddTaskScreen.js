import React, { useState , useRef } from "react";
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

export default function AddTaskScreen({ navigation, route }) {
  const { tasks, saveTasks } = route.params;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [dueDateTime, setDueDateTime] = useState(null); // store date+time
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // date or time
  const [reminder, setReminder] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleAddTask = () => {
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
      dueDateTime: dueDateTime ? dueDateTime.toISOString() : currentDateTime.toISOString(),
      completed: false,
      reminder: reminder,
    };

    saveTasks([newTask, ...tasks]);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#f8f9fa" // same as screen background
        barStyle="dark-content" // dark icons (time, battery, etc.)
      />
      <Text style={styles.heading}>Add New Task</Text>

      {/* Title Input */}
      <Animated.View style={{transform:[{translateX:shakeAnim}], width:"100%"}}>
      <TextInput
        style={styles.input}
        placeholder="Task title*"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
      />
      </Animated.View>

      {/* Description Input */}
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Task description"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Image Picker */}
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <Ionicons name="image-outline" size={50} color="#555" />
        )}
        <Text style={styles.imageText}>Pick Image (optional)</Text>
      </TouchableOpacity>

      {/* Date & Time Picker */}
      <View style={styles.dateTimeRow}>
        <TouchableOpacity style={styles.datePicker} onPress={() => showMode("date")}>
          <Ionicons
            name="calendar-outline"
            size={24}
            color="#555"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.dateText}>
            {dueDateTime ? dueDateTime.toLocaleDateString() : "Pick Date"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.datePicker} onPress={() => showMode("time")}>
          <Ionicons
            name="time-outline"
            size={24}
            color="#555"
            style={{ marginRight: 8 }}
          />
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

      {/* Reminder Toggle */}
      <View style={styles.reminderRow}>
        <Text style={styles.reminderText}>Set Reminder</Text>
        <Switch value={reminder} onValueChange={setReminder} />
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
        <Text style={styles.addButtonText}>Add Task</Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  heading: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontFamily: "Poppins_400Regular",
  },
  imagePicker: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
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
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  cancelButton: { alignItems: "center", paddingVertical: 10 },
  cancelText: { fontFamily: "Poppins_400Regular", fontSize: 16 },
});
