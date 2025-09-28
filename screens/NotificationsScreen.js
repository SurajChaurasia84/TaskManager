import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

export default function NotificationsScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    loadTasks();

    // Reload tasks on screen focus
    const unsubscribe = navigation.addListener("focus", () => {
      loadTasks();
    });
    return unsubscribe;
  }, [navigation]);

  const loadTasks = async () => {
    const stored = await AsyncStorage.getItem("tasks");
    if (stored) {
      let allTasks = JSON.parse(stored);

      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      // Keep only tasks with reminder=true and dueDateTime within last 7 days
      const upcoming = allTasks
        .filter(
          (t) =>
            t.reminder &&
            t.dueDateTime &&
            new Date(t.dueDateTime) > sevenDaysAgo
        )
        .sort((a, b) => new Date(a.dueDateTime) - new Date(b.dueDateTime));

      setUpcomingReminders(upcoming);
      setTasks(allTasks);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks().then(() => setRefreshing(false));
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#f8f9fa" // same as screen background
        barStyle="dark-content" // dark icons (time, battery, etc.)
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: "Poppins_600SemiBold" }]}>
          Reminders
        </Text>
        <View style={{ width: 28 }} /> {/* placeholder to align header */}
      </View>

      {/* Notification List */}
      {upcomingReminders.length === 0 ? (
        <Text style={styles.noRemindersText}>
          No upcoming reminders.
        </Text>
      ) : (
        <FlatList
          data={upcomingReminders}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.reminderItem}
              onPress={() =>
                navigation.navigate("TaskView", {
                  task: item,
                  saveTasks: async (updatedTasks) => {
                    await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
                    setTasks(updatedTasks);
                    loadTasks(); // refresh list after update
                  },
                  tasks,
                })
              }
            >
              <Text style={styles.reminderTitle}>{item.title?.toString()}</Text>
              <Text style={styles.reminderDescription}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {(item.description || "No description").toString()}
              </Text>
              <Text style={styles.reminderTime}>
                {new Date(item.dueDateTime)
                  .toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .toString()}
                <Feather name="chevron-right" />
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    color: "#333",
  },
  noRemindersText: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    fontFamily: "Poppins_400Regular",
  },
  reminderItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 10,
    elevation: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins_400Regular",
    maxHeight: 20,

  },
  reminderTime: {
    fontSize: 12,
    color: "#555",
    fontFamily: "Poppins_400Regular",
    marginTop: 6,
    textAlign: "right",
  },
});
