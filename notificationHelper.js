// 📁 notificationHelper.js
import * as Notifications from "expo-notifications";
import { Platform, ToastAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Configure notification behavior when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Keep reference to navigation object
let navigationRef = null;

/**
 * 📌 Set navigation reference for handling notification taps
 * Call this from App.js after NavigationContainer is created
 */
export function setNavigationRef(ref) {
  navigationRef = ref;
}

/**
 * 🔧 Initialize notifications (call once from App.js)
 */
export async function initNotifications() {
  try {
    // Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [250, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // Ask for permission
    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== "granted") {
      showInAppMessage(
        "Notifications are disabled. Enable them in settings to get reminders."
      );
    } else {
      // Show success toast only once
      const alreadyNotified = await AsyncStorage.getItem(
        "notificationsEnabledToast"
      );
      if (!alreadyNotified) {
        showInAppMessage("Notifications enabled successfully!");
        await AsyncStorage.setItem("notificationsEnabledToast", "true");
      }
    }

    // Listen for notification taps
    Notifications.addNotificationResponseReceivedListener((response) => {
      const taskId = response.notification.request.content.data.taskId;
      if (taskId && navigationRef) {
        setTimeout(() => {
          navigationRef.navigate("TaskView", { taskId });
        }, 400);
      }
    });
  } catch (error) {
    console.log("Notification initialization error:", error);
  }
}

/**
 * 🔔 Show small in-app message (toast)
 */
function showInAppMessage(message) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    console.log(message);
  }
}

/**
 * ⏰ Schedule a local notification for a given task
 * Saves notification ID in AsyncStorage so it can be canceled later
 */
export async function scheduleTaskNotification(task) {
  try {
    if (!task.reminder || !task.dueDateTime) return;

    const triggerTime = new Date(task.dueDateTime);
    if (triggerTime <= new Date()) {
      console.log("Skipping past reminder:", task.title);
      return;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${task.title}`,
        body: task.description || "You have a task reminder!",
        data: { taskId: task.id }, // For navigation
        sound: "default",
      },
      trigger: triggerTime,
    });

    // Save notificationId in AsyncStorage by task.id
    await AsyncStorage.setItem(
      `taskNotification_${task.id}`,
      notificationId
    );

    showInAppMessage(
      `Reminder set for ${triggerTime.toLocaleString()}`
    );
  } catch (error) {
    console.log("Error scheduling notification:", error);
  }
}

/**
 * ❌ Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    showInAppMessage("All notifications canceled.");
  } catch (error) {
    console.log("Error canceling notifications:", error);
  }
}

/**
 * ❌ Cancel a specific notification using task ID
 */
export async function cancelNotificationByTaskId(taskId) {
  try {
    const notificationId = await AsyncStorage.getItem(
      `taskNotification_${taskId}`
    );
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(`taskNotification_${taskId}`);
      showInAppMessage("Notification canceled.");
    }
  } catch (error) {
    console.log("Error canceling notification:", error);
  }
}
