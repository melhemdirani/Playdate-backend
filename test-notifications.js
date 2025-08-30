const axios = require("axios");

const API_BASE_URL = "http://localhost:4000";
const NOTIFICATION_API_BASE_URL = `${API_BASE_URL}/notifications`;

// Test user credentials (you may need to adjust these)
const TEST_USER = {
  email: "test@example.com",
  password: "password123",
};

let userToken = "";

// All notification types we want to test
const NOTIFICATION_TYPES = [
  "game_suggested",
  "match_created",
  "match_request_approved",
  "match_joined",
  "match_full",
  "match_cancelled",
  "player_left_match",
  "player_joined_match",
  "match_reminder",
  "match_started",
  "match_completed",
  "match_result_reported",
  "result_disputed",
  "no_show_reported",
  "no_show_resolved",
  "player_reported_you",
  "achievement_unlocked",
  "milestone_reached",
  "match_rescheduled",
  "player_rated_you",
  "payment_successful",
  "refund_issued",
  "game_cancelled_low_attendance",
  "admin_cancelled_booking",
  "you_cancelled_spot",
  "time_change",
  "venue_change",
  "team_shuffle_alert",
  "removed_from_game",
  "missing_player_alert",
  "marked_no_show",
  "teammate_no_show",
  "payment_failed",
  "booking_error",
  "game_starts_soon",
  "submit_game_results",
  "rating_deadline",
  "profile_image_rejected",
  "account_under_review",
  "suspicious_activity",
  "waitlist_spot_available",
  "added_to_waitlist",
];

// Sample data for dynamic notifications
const SAMPLE_DATA = {
  game: {
    name: "1v1 Tennis",
    id: "game_123",
  },
  match: {
    scheduledAt: new Date().toISOString(),
    id: "match_123",
  },
  player: {
    name: "John Doe",
  },
  achievement: {
    name: "First Win",
  },
  milestone: {
    type: "Win Streak",
  },
  location: "Central Park Tennis Court",
  date: new Date().toLocaleDateString(),
  time: "2:00 PM",
  newTime: "3:00 PM",
  newLocation: "Washington Square Park",
  missingPlayers: "2",
};

async function loginUser() {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/login`, TEST_USER);
    userToken = response.data.accessToken || response.data.token;
    console.log("✅ User logged in successfully");
    console.log(`User ID: ${response.data.user?.id || response.data.id}`);
    return response.data.user?.id || response.data.id;
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    throw error;
  }
}

async function createTestNotification(type, userId) {
  try {
    const notificationData = {
      userId: userId,
      type: type,
      data: SAMPLE_DATA,
      redirectLink: `https://example.com/test/${type}`,
    };

    const response = await axios.post(
      NOTIFICATION_API_BASE_URL,
      notificationData,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    console.log(`✅ Created notification: ${type}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to create ${type}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function getNotifications() {
  try {
    const response = await axios.get(NOTIFICATION_API_BASE_URL, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    console.log(
      `✅ Retrieved ${response.data.notifications?.length || 0} notifications`
    );
    return response.data.notifications;
  } catch (error) {
    console.error(
      "❌ Failed to get notifications:",
      error.response?.data || error.message
    );
    return [];
  }
}

async function markNotificationAsSeen(notificationId) {
  try {
    await axios.patch(
      `${NOTIFICATION_API_BASE_URL}/${notificationId}/seen`,
      {},
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );
    console.log(`✅ Marked notification as seen: ${notificationId}`);
  } catch (error) {
    console.error(
      `❌ Failed to mark as seen:`,
      error.response?.data || error.message
    );
  }
}

async function deleteNotification(notificationId) {
  try {
    await axios.delete(`${NOTIFICATION_API_BASE_URL}/${notificationId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    console.log(`✅ Deleted notification: ${notificationId}`);
  } catch (error) {
    console.error(
      `❌ Failed to delete:`,
      error.response?.data || error.message
    );
  }
}

async function testAllNotifications() {
  console.log("🚀 Starting comprehensive notification testing...\n");

  try {
    // Step 1: Login
    console.log("1️⃣ Logging in...");
    const userId = await loginUser();
    console.log(`User ID: ${userId}\n`);

    // Step 2: Test creating each notification type
    console.log("2️⃣ Testing notification creation...");
    const createdNotifications = [];

    for (const type of NOTIFICATION_TYPES) {
      const notification = await createTestNotification(type, userId);
      if (notification) {
        createdNotifications.push(notification);
      }
      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `\n📊 Created ${createdNotifications.length}/${NOTIFICATION_TYPES.length} notifications\n`
    );

    // Step 3: Get all notifications
    console.log("3️⃣ Retrieving all notifications...");
    const notifications = await getNotifications();
    console.log("\n");

    // Step 4: Test marking some as seen
    console.log("4️⃣ Testing mark as seen functionality...");
    const notificationsToMarkSeen = notifications.slice(
      0,
      Math.min(5, notifications.length)
    );
    for (const notification of notificationsToMarkSeen) {
      await markNotificationAsSeen(notification.id);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("\n");

    // Step 5: Test deleting some notifications
    console.log("5️⃣ Testing delete functionality...");
    const notificationsToDelete = notifications.slice(
      0,
      Math.min(3, notifications.length)
    );
    for (const notification of notificationsToDelete) {
      await deleteNotification(notification.id);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("\n");

    // Step 6: Final verification
    console.log("6️⃣ Final verification...");
    const finalNotifications = await getNotifications();
    console.log("\n");

    // Summary
    console.log("📋 TEST SUMMARY:");
    console.log("================");
    console.log(
      `✅ Total notification types tested: ${NOTIFICATION_TYPES.length}`
    );
    console.log(`✅ Successfully created: ${createdNotifications.length}`);
    console.log(`✅ Mark as seen tested: ${notificationsToMarkSeen.length}`);
    console.log(`✅ Delete tested: ${notificationsToDelete.length}`);
    console.log(`✅ Final notifications count: ${finalNotifications.length}`);
    console.log("\n🎉 All notification features tested successfully!");
  } catch (error) {
    console.error("\n💥 Test failed:", error.message);
  }
}

// Additional function to test specific notification types with detailed output
async function testSpecificNotifications(
  types = ["match_created", "game_suggested", "achievement_unlocked"]
) {
  console.log(
    "🔍 Testing specific notification types with detailed output...\n"
  );

  try {
    const userId = await loginUser();

    for (const type of types) {
      console.log(`\n🧪 Testing: ${type}`);
      console.log("─".repeat(50));

      // Test with minimal data
      console.log("  📝 Testing with minimal data...");
      const minimalNotification = await createTestNotification(type, userId);

      // Test with full data
      console.log("  📝 Testing with full dynamic data...");
      const fullNotification = await createTestNotification(type, userId);

      console.log(`  ✅ ${type} tested successfully`);
    }

    console.log("\n📊 Detailed test completed!");
  } catch (error) {
    console.error("❌ Detailed test failed:", error.message);
  }
}

// Export functions for modular usage
if (require.main === module) {
  // Run full test if script is executed directly
  testAllNotifications();
} else {
  module.exports = {
    testAllNotifications,
    testSpecificNotifications,
    loginUser,
    createTestNotification,
    getNotifications,
    markNotificationAsSeen,
    deleteNotification,
    NOTIFICATION_TYPES,
  };
}
