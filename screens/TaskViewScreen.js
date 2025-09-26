import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

export default function ViewTaskScreen({ route, navigation }) {
  const { task, saveTasks, tasks } = route.params;

  const [reminder, setReminder] = useState(task.reminder);
  const [modalVisible, setModalVisible] = useState(false);
  const [snapshotUri, setSnapshotUri] = useState(null);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const viewRef = useRef();

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });
  if (!fontsLoaded) return null;

  const saveEdits = () => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, title, description } : t
    );
    saveTasks(updatedTasks);
    setEditing(false);
    setShowDiscardModal(false);
  };

  const discardEdits = () => {
    setTitle(task.title);
    setDescription(task.description || "");
    setEditing(false);
    setShowDiscardModal(false);
  };

  const handleBack = () => {
    if (editing) {
      setShowDiscardModal(true);
    } else {
      navigation.goBack();
    }
  };

  const toggleReminder = () => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, reminder: !reminder } : t
    );
    saveTasks(updatedTasks);
    setReminder(!reminder);
  };

  const handleShare = async () => {
    try {
      const uri = await viewRef.current.capture();
      setSnapshotUri(uri);
      setModalVisible(true);
    } catch (err) {
      console.log("Error capturing task:", err);
    }
  };

  const confirmShare = async () => {
    try {
      if (snapshotUri) await Sharing.shareAsync(snapshotUri);
      setModalVisible(false);
    } catch (err) {
      console.log("Error sharing:", err);
    }
  };

  const confirmDelete = () => {
    const updatedTasks = tasks.filter((t) => t.id !== task.id);
    saveTasks(updatedTasks);
    setShowDeleteModal(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: "Poppins_600SemiBold" }]}>
          Task Details
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Task content */}
      <ViewShot ref={viewRef} options={{ format: "png", quality: 1 }} style={styles.contentCard}>
        {editing ? (
          <>
            <TextInput
              style={[styles.title, { borderBottomWidth: 1, borderBottomColor: "#ccc" }]}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.editDescription}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity onPress={saveEdits} style={{ alignSelf: "flex-end", marginTop: 10 }}>
              <Text style={{ color: "green", fontFamily: "Poppins_600SemiBold" }}>Save</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.metaBox}>
              <Text style={styles.metaValue}>
                {task.dueDateTime ? new Date(task.dueDateTime).toLocaleString() : "No due date"}
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
              <Text style={styles.description}>{description}</Text>
            </ScrollView>
          </>
        )}

        {/* Image (if added in AddTask) */}
        {task.image && (
          <Image
            source={{ uri: task.image }}
            style={{ width: "100%", height:200, marginTop: 15, borderRadius: 10 }}
            resizeMode="cover"
          />
        )}

      </ViewShot>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setEditing(!editing)}>
          <Ionicons name="create-outline" size={24} color="#9580FA" />
          <Text style={styles.actionText}>{editing ? "Cancel" : "Edit"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => setShowDeleteModal(true)}>
          <Ionicons name="trash-outline" size={24} color="tomato" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color="green" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={toggleReminder}>
          <Ionicons
            name={reminder ? "alarm-outline" : "time-outline"}
            size={24}
            color={reminder ? "tomato" : "#777"}
          />
          <Text style={styles.actionText}>{reminder ? "On" : "Off"}</Text>
        </TouchableOpacity>
      </View>

      {/* Share Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, marginBottom: 10 }}>
              Preview & Share
            </Text>

            {snapshotUri && (
              <Image
                source={{ uri: snapshotUri }}
                style={{ width: "100%", height: 300, marginBottom: 10, borderRadius: 10 }}
              />
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={{ fontFamily: "Poppins_600SemiBold", color: "#333" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalButton} onPress={confirmShare}>
                <Text style={{ fontFamily: "Poppins_600SemiBold", color: "green" }}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Discard Changes Modal */}
      <Modal visible={showDiscardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, marginBottom: 15 }}>
              You have unsaved changes
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity style={styles.modalButton} onPress={saveEdits}>
                <Text style={{ color: "#9580FA", fontFamily: "Poppins_600SemiBold" }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={discardEdits}>
                <Text style={{ color: "tomato", fontFamily: "Poppins_600SemiBold" }}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, marginBottom: 15 }}>
              Are you sure you want to delete this task?
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowDeleteModal(false)}>
                <Text style={{ color: "#9580FA", fontFamily: "Poppins_600SemiBold" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={confirmDelete}>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, color: "#333" },
  contentCard: { padding: 20, flex: 1, backgroundColor: "#f5f6fa" },
  title: { fontSize: 22, fontFamily: "Poppins_600SemiBold", color: "#000" },
  description: { fontSize: 16, fontFamily: "Poppins_400Regular", color: "#555" },
  editDescription: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#555",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    height: 120, // fixed height for editing
    textAlignVertical: "top",
    marginTop: 10,
  },
  metaBox: { marginBottom: 10 },
  metaLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#9580FA" },
  metaValue: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "#333" },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position:"absolute",
    bottom:0,
    left :0,
    right:0,
  },
  actionButton: { alignItems: "center" },
  actionText: { fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: 4, color: "#333" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "#fff", borderRadius: 12, padding: 15 },
  modalButton: { paddingHorizontal: 20, paddingVertical: 10 },
});
