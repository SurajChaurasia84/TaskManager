import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Switch,
  Animated,
  Modal,
  ScrollView,
  FlatList,
  Platform,
  ToastAndroid,
  BackHandler,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleTaskNotification } from "../notificationHelper";
import { Calendar } from "react-native-calendars";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

// In-app toast function
function showInAppMessage(message) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    console.log(message);
  }
}

export default function AddTaskScreen({ navigation, route }) {
  const { tasks, saveTasks } = route.params;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [reminder, setReminder] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [ampm, setAmPm] = useState("AM");

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Handle device back button for modals
  useEffect(() => {
    const backAction = () => {
      if (timeModalVisible) {
        setTimeModalVisible(false);
        setDateModalVisible(true); // go back to date modal
        return true; // prevent default
      } else if (dateModalVisible) {
        setDateModalVisible(false);
        setReminder(false);
        return true; // prevent default
      }
      return false; // allow default back action
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [dateModalVisible, timeModalVisible]);

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
      mediaTypes: "Images",
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleAddTask = async () => {
    if (title.trim() === "") {
      triggerShake();
      showInAppMessage("Task title is required");
      return;
    }

    let finalDateTime = new Date();

    if (reminder) {
      if (!selectedDate || hour === "" || minute === "") {
        showInAppMessage("Please select a valid date and time");
        return;
      }

      let h = parseInt(hour);
      const m = parseInt(minute);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        showInAppMessage("Enter valid hour and minute");
        return;
      }

      finalDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        h,
        m
      );

      if (finalDateTime <= new Date()) {
        showInAppMessage("Cannot set reminder in the past");
        return;
      }
    }

    const task = {
      id: Date.now().toString(),
      title,
      description,
      image,
      dueDateTime: finalDateTime.toISOString(),
      completed: false,
      reminder,
    };

    saveTasks([task, ...tasks]);

    if (reminder) await scheduleTaskNotification(task);

    showInAppMessage("Task added successfully!");
    navigation.goBack();
  };

  const handleReminderToggle = (value) => {
    setReminder(value);
    if (value) setDateModalVisible(true);
  };

  const ampmOptions = ["AM", "PM"];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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
          {image ? <Image source={{ uri: image }} style={styles.imagePreview} /> : <Ionicons name="image-outline" size={50} color="#555" />}
          <Text style={styles.imageText}>Pick Image (optional)</Text>
        </TouchableOpacity>

        <View style={styles.reminderRow}>
          <Text style={styles.reminderText}>Set Reminder</Text>
          <Switch value={reminder} onValueChange={handleReminderToggle} />
        </View>

        {/* Date Modal */}
        <Modal visible={dateModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <Calendar
                minDate={new Date().toISOString().split("T")[0]}
                onDayPress={(day) => setSelectedDate(new Date(day.timestamp))}
                markedDates={selectedDate ? { [selectedDate.toISOString().split("T")[0]]: { selected: true } } : {}}
              />
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                <TouchableOpacity onPress={() => { setDateModalVisible(false); setReminder(false); }}>
                  <Text style={{ color: "tomato", fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (!selectedDate) {
                      showInAppMessage("Please select a date");
                      return;
                    }
                    setDateModalVisible(false);
                    setTimeModalVisible(true);
                  }}
                >
                  <Text style={{ color: "green", fontSize: 16 }}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Time Modal */}
        <Modal visible={timeModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Time (12-hour)</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 5 }]}
                  placeholder="HH"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  maxLength={2}
                  value={hour}
                  onChangeText={(text) => {
                    let num = text.replace(/\D/g, "");
                    if (parseInt(num) > 12) num = "12";
                    setHour(num);
                  }}
                />
                <Text style={{ fontSize: 20, marginHorizontal: 2 }}>:</Text>
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 5 }]}
                  placeholder="MM"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  maxLength={2}
                  value={minute}
                  onChangeText={(text) => {
                    let num = text.replace(/\D/g, "");
                    if (parseInt(num) > 59) num = "59";
                    setMinute(num);
                  }}
                />
              </View>
              <View style={{ marginVertical: 10 }}>
                <FlatList
                  horizontal
                  data={ampmOptions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{
                        padding: 10,
                        backgroundColor: ampm === item ? "tomato" : "#ddd",
                        borderRadius: 8,
                        marginRight: 10,
                      }}
                      onPress={() => setAmPm(item)}
                    >
                      <Text style={{ fontSize: 16, color: ampm === item ? "#fff" : "#000" }}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => { setTimeModalVisible(false); setDateModalVisible(true); }}
                >
                  <Text style={{ color: "tomato", fontSize: 16 }}>Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (!hour || !minute) {
                      showInAppMessage("Enter valid hour and minute");
                      return;
                    }
                    setTimeModalVisible(false);
                    setReminder(true);
                  }}
                >
                  <Text style={{ color: "green", fontSize: 16 }}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonText}>Add Task</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 20 },
  heading: { fontSize: 26, fontFamily: "Poppins_700Bold", marginBottom: 20 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 15, fontFamily: "Poppins_400Regular" },
  imagePicker: { justifyContent: "center", alignItems: "center", marginBottom: 20 },
  imagePreview: { width: 100, height: 100, borderRadius: 10 },
  imageText: { marginTop: 5, fontFamily: "Poppins_400Regular" },
  reminderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  reminderText: { fontFamily: "Poppins_400Regular", fontSize: 16 },
  addButton: { backgroundColor: "tomato", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginBottom: 10 },
  addButtonText: { color: "#fff", fontSize: 16, fontFamily: "Poppins_600SemiBold" },
  cancelButton: { alignItems: "center", paddingVertical: 10 },
  cancelText: { fontFamily: "Poppins_400Regular", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "90%", backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  modalTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18, marginBottom: 15, textAlign: "center" },
});
