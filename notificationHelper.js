// 📁 notificationHelper.js
import * as Notifications from "expo-notifications";
import { Platform, ToastAndroid } from "react-native";

// ✅ Configure notification behavior when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Keep reference to navigation object
let navigationRef = null;

/**
 * 📌 Set navigation reference so we can navigate when a notification is tapped
 * Call this from App.js -> inside useEffect after NavigationContainer is created
 */
export function setNavigationRef(ref) {
  navigationRef = ref;
}

/**
 * 🔧 Initialize notifications (call once from App.js)
 */
export async function initNotifications() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [250, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      showInAppMessage(
        "Notifications are disabled. Enable them in settings to get reminders."
      );
    } else {
      showInAppMessage("Notifications enabled successfully!");
    }

    // 👇 Listen for when user taps a notification
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
 */
export async function scheduleTaskNotification(task) {
  try {
    if (!task.reminder || !task.dueDateTime) return;

    const triggerTime = new Date(task.dueDateTime);
    if (triggerTime <= new Date()) {
      console.log("Skipping past reminder:", task.title);
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '${task.title}',
        body: task.description || "You have a task reminder!",
        data: { taskId: task.id }, // 👈 include taskId for navigation
        sound: "default",
      },
      trigger: triggerTime,
    });

    showInAppMessage(`Reminder set for ${triggerTime.toLocaleString()}`);
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
 * ❌ Cancel a specific notification
 */
export async function cancelNotificationById(identifier) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    showInAppMessage("Notification canceled.");
  } catch (error) {
    console.log("Error canceling notification:", error);
  }
}
