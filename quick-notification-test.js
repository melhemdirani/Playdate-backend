#!/usr/bin/env node

/**
 * Quick Notification Tester
 * Run with: node quick-notification-test.js
 */

const axios = require("axios");

const API_BASE_URL = "http://localhost:4000";

// Configuration
const TEST_USER = {
  email: "test@example.com",
  password: "password123",
};

// Quick test scenarios
const QUICK_TESTS = [
  {
    name: "Match Created",
    type: "match_created",
    data: { game: { name: "1v1 Tennis" } },
  },
  {
    name: "Game Suggestion",
    type: "game_suggested",
    data: { game: { name: "5v5 Football" } },
  },
  {
    name: "Achievement Unlocked",
    type: "achievement_unlocked",
    data: { achievement: { name: "First Win" } },
  },
  {
    name: "Match Full",
    type: "match_full",
    data: { game: { name: "3v3 Basketball" }, time: "2:00 PM" },
  },
  {
    name: "Payment Success",
    type: "payment_successful",
    data: { game: { name: "1v1 Padel" } },
  },
];

async function quickTest() {
  console.log("🏃‍♂️ Quick Notification Test Started\n");

  try {
    // Login
    console.log("🔑 Logging in...");
    const loginResponse = await axios.post(
      `${API_BASE_URL}/users/login`,
      TEST_USER
    );
    const token = loginResponse.data.accessToken || loginResponse.data.token;
    const user = loginResponse.data.user || loginResponse.data;
    console.log(`✅ Logged in as: ${user.email}\n`);

    // Test each scenario
    for (const test of QUICK_TESTS) {
      console.log(`🧪 Testing: ${test.name}`);

      try {
        const response = await axios.post(
          `${API_BASE_URL}/notifications`,
          {
            userId: user.id,
            type: test.type,
            data: test.data,
            redirectLink: `https://example.com/test/${test.type}`,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log(`  ✅ ${test.name} - Success`);
        console.log(
          `  📱 ID: ${response.data.notification?.id || response.data.id}`
        );
      } catch (error) {
        console.log(
          `  ❌ ${test.name} - Failed: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }

    // Get all notifications
    console.log("\n📥 Retrieving notifications...");
    const notificationsResponse = await axios.get(
      `${API_BASE_URL}/notifications`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const notifications = notificationsResponse.data.notifications || [];
    console.log(`✅ Found ${notifications.length} notifications\n`);

    // Show latest 3 notifications
    if (notifications.length > 0) {
      console.log("📋 Latest notifications:");
      notifications.slice(0, 3).forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title}`);
        console.log(`     ${notif.subtitle}`);
        console.log(`     Type: ${notif.type} | Urgency: ${notif.urgency}`);
        console.log("");
      });
    }

    console.log("🎉 Quick test completed successfully!");
  } catch (error) {
    console.error("💥 Test failed:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log(
        "\n💡 Tip: Make sure you have a test user account. Create one with:"
      );
      console.log(
        `curl -X POST ${API_BASE_URL}/users/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123","username":"testuser"}'`
      );
    }
  }
}

// Additional function for testing specific notification type
async function testSpecificType(type, gameType = "1v1 Tennis") {
  console.log(`🎯 Testing specific type: ${type}\n`);

  try {
    const loginResponse = await axios.post(
      `${API_BASE_URL}/users/login`,
      TEST_USER
    );
    const { token, user } = loginResponse.data;

    const response = await axios.post(
      `${API_BASE_URL}/notifications`,
      {
        userId: user.id,
        type: type,
        data: { game: { name: gameType } },
        redirectLink: `/test/${type}`,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ Notification created:");
    console.log(`  Title: ${response.data.notification?.title || "N/A"}`);
    console.log(`  Content: ${response.data.notification?.subtitle || "N/A"}`);
    console.log(`  Type: ${response.data.notification?.type || "N/A"}`);
  } catch (error) {
    console.error("❌ Failed:", error.response?.data || error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  quickTest();
} else if (args[0] === "test" && args[1]) {
  testSpecificType(args[1], args[2]);
} else {
  console.log("Usage:");
  console.log(
    "  node quick-notification-test.js                    # Run quick test"
  );
  console.log(
    "  node quick-notification-test.js test <type> [game] # Test specific type"
  );
  console.log("");
  console.log("Examples:");
  console.log(
    '  node quick-notification-test.js test match_created "5v5 Football"'
  );
  console.log("  node quick-notification-test.js test achievement_unlocked");
}
