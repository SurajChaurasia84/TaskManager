// HomeScreen.js
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { SwipeListView } from "react-native-swipe-list-view";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

export default function HomeScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [username, setUsername] = useState();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("Today"); // "Today" | "All"
  const [showFilter, setShowFilter] = useState(false);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    const fetchName = async () => {
      const savedName = await AsyncStorage.getItem("username");
      if (savedName) setUsername(savedName);
    };
    fetchName();
  }, []);

  useEffect(() => {
    loadTasks();
  }, []);

  // keep tasks sorted: incomplete first, completed last
  const sortTasks = (arr) =>
    arr
      .slice()
      .sort((a, b) => {
        const A = a.completed ? 1 : 0;
        const B = b.completed ? 1 : 0;
        if (A === B) return 0;
        return A - B;
      });

  const loadTasks = async () => {
    const stored = await AsyncStorage.getItem("tasks");
    if (stored) {
      const parsed = JSON.parse(stored);
      setTasks(sortTasks(parsed));
    }
  };

  // saveTasks will sort then persist
  const saveTasks = async (newTasks) => {
    const sorted = sortTasks(newTasks);
    setTasks(sorted);
    await AsyncStorage.setItem("tasks", JSON.stringify(sorted));
  };

  const onDateChange = (event, date) => {
    setShowCalendar(false);
    if (date) setSelectedDate(date);
  };

  const toggleComplete = (task) => {
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );
    saveTasks(updated);
  };

  const toggleReminder = async (task) => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, reminder: !t.reminder } : t
    );
    saveTasks(updatedTasks);

    // schedule only when turning ON and dueDate exists
    if (!task.reminder && task.dueDateTime) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Task Reminder ⏰",
            body: `Don't forget: ${task.title}`,
            sound: true,
          },
          trigger: new Date(task.dueDateTime),
        });
      } catch (e) {
        console.log("Notification schedule error:", e);
      }
    }
  };

  if (!fontsLoaded) return null;

  // Today's tasks
  const todaysTasks = tasks.filter((t) => {
    if (!t.dueDateTime) return false;
    const taskDate = new Date(t.dueDateTime);
    return (
      taskDate.getFullYear() === selectedDate.getFullYear() &&
      taskDate.getMonth() === selectedDate.getMonth() &&
      taskDate.getDate() === selectedDate.getDate()
    );
  });

  // Base tasks (Today or All)
  const filteredBaseTasks = filterMode === "Today" ? todaysTasks : tasks;

  // Search filter (case-insensitive)
  const searchedTasks = filteredBaseTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalToday = todaysTasks.length;
  const completedToday = todaysTasks.filter((t) => t.completed).length;

  const totalAll = tasks.length;
  const completedAll = tasks.filter((t) => t.completed).length;

  const totalCount = filterMode === "Today" ? totalToday : totalAll;
  const completedCount = filterMode === "Today" ? completedToday : completedAll;
  const progress = totalCount ? (completedCount / totalCount) * 100 : 0;

  // --- SwipeListView renderers ---
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
  style={[
    styles.taskItem,
    item.completed && styles.completedTaskItem // custom style
  ]}
  disabled={!!item.completed}
  onPress={() =>
    navigation.navigate("TaskView", { task: item, saveTasks, tasks })
  }
>
        <View style={styles.taskRow}>
          <Text style={styles.taskTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => toggleComplete(item)}>
              <Ionicons
                name={item.completed ? "checkbox-outline" : "square-outline"}
                size={22}
                color={item.completed ? "#9580FA" : "#777"}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => toggleReminder(item)}>
              <Ionicons
                name={item.reminder ? "alarm-outline" : "time-outline"}
                size={22}
                color={item.reminder ? "tomato" : "#777"}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.descRow}>
          <Text style={styles.taskDescription}>
            {item.description || "No description"}
          </Text>
          <Text style={styles.taskTime}>
            {item.dueDateTime
              ? new Date(item.dueDateTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHiddenItem = (data, rowMap) => {
  return (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.hiddenDelete}
        onPress={() => {
          if (rowMap[data.item.id]) {
            rowMap[data.item.id].closeRow();
          }
          setTaskToDelete(data.item);
          setDeleteModalVisible(true);
        }}
      >
        <Ionicons name="trash-outline" size={22} color="tomato" />
      </TouchableOpacity>
    </View>
  );
};

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    const updated = tasks.filter((t) => t.id !== taskToDelete.id);
    await saveTasks(updated);
    setTaskToDelete(null);
    setDeleteModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#f8f9fa"
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={30} color="black" />
        </TouchableOpacity>

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={26} color="black" style={{ marginRight: 20 }} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowCalendar(true)}>
            <Ionicons name="calendar-outline" size={26} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {showCalendar && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { fontFamily: "Poppins_600SemiBold" }]}>
          Hello! {username}
        </Text>

        {filterMode === "Today" ? (
          <Text style={{ color: "#777", fontFamily: "Poppins_400Regular" }}>
            Added {totalToday} Task{totalToday === 1 || totalToday === 0 ? "" : "s"} today
          </Text>
        ) : (
          <Text style={{ color: "#777", fontFamily: "Poppins_400Regular" }}>
            {totalAll} total tasks ({completedAll} completed)
          </Text>
        )}

        <Text style={{ fontFamily: "Poppins_400Regular", marginTop: 5 }}>
          Showing tasks for:{" "}
          {filterMode === "Today"
            ? selectedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "All Tasks"}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#555" style={{ marginLeft: 6 }} />
        <TextInput
          placeholder="Search Tasks"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1, marginLeft: 8, fontFamily: "Poppins_400Regular" }}
        />
        <TouchableOpacity onPress={() => setShowFilter(!showFilter)}>
          <Ionicons name="options-outline" size={20} color="red" style={{ marginRight: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      {showFilter && (
        <View style={styles.filterBox}>
          <TouchableOpacity onPress={() => { setFilterMode("Today"); setShowFilter(false); }}>
            <Text style={[styles.filterOption, filterMode === "Today" && styles.filterActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setFilterMode("All"); setShowFilter(false); }}>
            <Text style={[styles.filterOption, filterMode === "All" && styles.filterActive]}>All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress card */}
      <Text style={styles.sectionHeader}>
        {filterMode === "Today" ? "Ongoing Task" : "All Progress"}
      </Text>
      <View style={styles.ongoingCard}>
        <AnimatedCircularProgress
          size={120}
          width={12}
          fill={progress}
          rotation={0}
          tintColor="tomato"
          backgroundColor="#eee"
        >
          {(fill) => <Text style={styles.progressText}>{Math.round(progress)}%</Text>}
        </AnimatedCircularProgress>
        <Text style={{ fontFamily: "Poppins_400Regular", marginTop: 10, textAlign: "center" }}>
          {completedCount} of {totalCount} tasks completed
        </Text>
      </View>

      {/* Tasks list using SwipeListView */}
      <Text style={styles.sectionHeader}>
        {filterMode === "Today" ? "Today's Tasks" : "All Tasks"}
      </Text>

      {searchedTasks.length === 0 && (
        <Text style={{ textAlign: "center", fontFamily: "Poppins_400Regular" }}>
          No tasks found.
        </Text>
      )}

      <SwipeListView
        data={searchedTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-60}
        disableRightSwipe={true}
        contentContainerStyle={{ paddingBottom: 160 }}
      />

      {/* Add Task */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddTask", { saveTasks, tasks })}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontFamily: "Poppins_600SemiBold" }}>
          Add New Task
        </Text>
      </TouchableOpacity>

      {/* Delete confirmation modal (in-app) */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", marginBottom: 10 }}>
              Delete task?
            </Text>
            <Text style={{ fontFamily: "Poppins_400Regular", marginBottom: 20 }}>
              Are you sure you want to delete "{taskToDelete?.title}"?
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity onPress={() => { setDeleteModalVisible(false); setTaskToDelete(null); }} style={{ marginRight: 16 }}>
                <Text style={{ color: "#555", fontFamily: "Poppins_600SemiBold" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete}>
                <Text style={{ color: "tomato", fontFamily: "Poppins_600SemiBold" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  greeting: { paddingHorizontal: 20, marginBottom: 15 },
  greetingText: { fontSize: 22 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 4,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  filterBox: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 8,
    elevation: 3,
    paddingVertical: 8,
    marginBottom: 10,
  },
  filterOption: {
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  filterActive: {
    color: "tomato",
    fontFamily: "Poppins_600SemiBold",
  },
  sectionHeader: {
    marginHorizontal: 20,
    marginBottom: 10,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#9580FA",
  },
  ongoingCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 20,
    alignItems: "center",
  },
  progressText: { fontSize: 22, fontFamily: "Poppins_600SemiBold" },
  taskItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 1,
    marginBottom: 8,
    maxHeight: 92,
    overflow: "hidden",
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginRight: 10,
  },
  descRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  taskDescription: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins_400Regular",
    marginRight: 10,
  },
  taskTime: {
    fontSize: 12,
    color: "#555",
    fontFamily: "Poppins_400Regular",
  },
  addButton: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    backgroundColor: "tomato",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    elevation: 5,
  },

  /* Hidden row (delete) */
  rowBack: {
  flex: 1,
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "center",
  // marginHorizontal: 20,
  marginBottom: 8,
  borderRadius: 10,
},
  hiddenDelete: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "tomato",
    height: "100%",
    borderRadius:10,
  },

  /* delete modal */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "85%", backgroundColor: "#fff", borderRadius: 12, padding: 16 },
completedTaskItem: {
  backgroundColor: "#f0f0f0", // light gray bg
},

});
