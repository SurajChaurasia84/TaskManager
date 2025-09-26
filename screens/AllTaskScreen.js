import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Entypo, Feather } from "@expo/vector-icons";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { useIsFocused } from "@react-navigation/native";

export default function AllTaskScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const isFocused = useIsFocused();

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Load tasks on focus
  useEffect(() => {
    if (isFocused) loadTasks();
  }, [isFocused]);

  const loadTasks = async () => {
    const stored = await AsyncStorage.getItem("tasks");
    if (stored) setTasks(JSON.parse(stored));
    else setTasks([]);
  };

  // Back handler for Android
  useEffect(() => {
    const backAction = () => {
      if (sortModalVisible) {
        setSortModalVisible(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [sortModalVisible]);

  if (!fontsLoaded) return null;

  // Sorting functions
  const sortNewestFirst = () => {
    const sorted = [...tasks].sort(
      (a, b) => new Date(b.dueDateTime) - new Date(a.dueDateTime)
    );
    setTasks(sorted);
    setSortModalVisible(false);
  };

  const sortOldestFirst = () => {
    const sorted = [...tasks].sort(
      (a, b) => new Date(a.dueDateTime) - new Date(b.dueDateTime)
    );
    setTasks(sorted);
    setSortModalVisible(false);
  };

  const showUpcomingTasks = () => {
    const now = new Date();
    const upcoming = tasks.filter(
      (task) => task.dueDateTime && new Date(task.dueDateTime) > now
    );
    setTasks(upcoming);
    setSortModalVisible(false);
  };

  // Label for day (Today, Yesterday, or date)
  const getDayLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    } else if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    } else {
      return null;
    }
  };

  // Group tasks by day
  const groupTasksByDate = () => {
    const grouped = {};
    tasks.forEach((task) => {
      if (task.dueDateTime) {
        const dateObj = new Date(task.dueDateTime);
        const dayLabel = getDayLabel(task.dueDateTime) || "";
        const dateLabel = !dayLabel
          ? dateObj.toDateString()
          : dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
        const key = dayLabel ? `${dayLabel}` : dateLabel;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(task);
      } else {
        if (!grouped["No Date"]) grouped["No Date"] = [];
        grouped["No Date"].push(task);
      }
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const dateA = grouped[a][0]?.dueDateTime ? new Date(grouped[a][0].dueDateTime) : new Date(0);
      const dateB = grouped[b][0]?.dueDateTime ? new Date(grouped[b][0].dueDateTime) : new Date(0);
      return dateB - dateA;
    });

    return { grouped, sortedKeys };
  };

  const { grouped, sortedKeys } = groupTasksByDate();

  const handleCloseModal = () => {
    if (sortModalVisible) setSortModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#f8f9fa"
        barStyle="dark-content"
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (sortModalVisible) setSortModalVisible(false);
          else navigation.goBack();
        }}>
          <Ionicons name="arrow-back-outline" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.heading}>All Tasks</Text>
        <TouchableOpacity onPress={() => setSortModalVisible(!sortModalVisible)}>
          <Entypo name="dots-three-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {sortModalVisible && (
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sortDropdown}>
                <TouchableOpacity style={styles.modalItem} onPress={sortNewestFirst}>
                  <Text style={styles.modalText}>Newest Date First</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalItem} onPress={sortOldestFirst}>
                  <Text style={styles.modalText}>Oldest Date First</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalItem} onPress={showUpcomingTasks}>
                  <Text style={styles.modalText}>Upcoming Tasks</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Task List */}
      <FlatList
        data={sortedKeys}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View>
            <Text style={styles.dateLabel}>{item}</Text>
            {grouped[item].map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskItem}
                onPress={() => navigation.navigate("TaskView", { task })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16 }}>
                    {task.title}
                  </Text>

                  {task.description ? (
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 14,
                        color: "#666",
                        marginTop: 4,
                        maxHeight: 20, // Approx 1 line height
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {task.description}
                    </Text>
                  ) : null}

                  {/* Completed label */}
                  {task.completed && (
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 12,
                        color: "tomato",
                        marginTop: 2,
                      }}
                    >
                      Completed
                    </Text>
                  )}
                </View>

                {task.dueDateTime && (
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 12,
                      color: "#666",
                    }}
                  >
                    {new Date(task.dueDateTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                )}
                <Feather name="chevron-right" size={20} color="#999" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export function TaskViewScreen({ route }) {
  const { task } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: "#f5f6fa" }}>
      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 22 }}>
        {task.title}
      </Text>
      {task.description && (
        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 16, marginTop: 10 }}>
          {task.description}
        </Text>
      )}
      {task.dueDateTime && (
        <Text style={{ marginTop: 10, color: "#666", fontFamily: "Poppins_400Regular" }}>
          {new Date(task.dueDateTime).toLocaleString()}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa", paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  heading: {
    fontSize: 22,
    fontFamily: "Poppins_600SemiBold",
  },
  dateLabel: {
    marginTop: 8,
    marginBottom: 8,
    color: "green",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  taskItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 4,
    elevation: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sortDropdown: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
    zIndex: 10,
    overflow: "hidden",
    position: "absolute",
    top: 55,
    right: 20,
  },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  modalText: { fontFamily: "Poppins_400Regular", fontSize: 16 },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
});
