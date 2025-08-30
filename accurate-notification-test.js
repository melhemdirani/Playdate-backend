#!/usr/bin/env node

/**
 * ACCURATE NOTIFICATION TESTING
 *
 * Tests only the notification types that are actually defined in the system
 */

const axios = require("axios");

const API_BASE_URL = "http://localhost:4000";

// Test credentials
const ADMIN_CREDS = {
  email: "admin1@admin.admin",
  password: "Admin1234",
};

const TEST_USER_CREDS = {
  email: "test@example.com",
  password: "password123",
};

// ACTUALLY DEFINED notification types from data.ts
const DEFINED_NOTIFICATION_TYPES = [
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
];

let adminToken = "";
let userToken = "";
let userId = "";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const authRequest = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

async function setupAuth() {
  console.log("🔑 Setting up authentication...");

  try {
    // Login admin
    const adminResponse = await axios.post(
      `${API_BASE_URL}/users/login`,
      ADMIN_CREDS
    );
    adminToken = adminResponse.data.accessToken;
    console.log("✅ Admin logged in");

    // Login test user
    const userResponse = await axios.post(
      `${API_BASE_URL}/users/login`,
      TEST_USER_CREDS
    );
    userToken = userResponse.data.accessToken;
    userId = userResponse.data.user.id;
    console.log("✅ User logged in");
  } catch (error) {
    console.error(
      "❌ Authentication failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function analyzeCurrentUsage() {
  console.log("\n📊 ANALYZING CURRENT NOTIFICATION USAGE");
  console.log("=".repeat(60));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(userToken)
    );
    const notifications = response.data.notifications || response.data || [];

    const typeUsage = {};
    notifications.forEach((notif) => {
      typeUsage[notif.type] = (typeUsage[notif.type] || 0) + 1;
    });

    const usedTypes = Object.keys(typeUsage);
    const unusedTypes = DEFINED_NOTIFICATION_TYPES.filter(
      (type) => !usedTypes.includes(type)
    );

    console.log(`📬 Total notifications: ${notifications.length}`);
    console.log(
      `✅ Defined types in use: ${usedTypes.length}/${DEFINED_NOTIFICATION_TYPES.length}`
    );
    console.log(`❌ Unused defined types: ${unusedTypes.length}`);

    console.log("\n🔥 Most Used Types:");
    Object.entries(typeUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} times`);
      });

    console.log("\n💤 Unused Types (Sample):");
    unusedTypes.slice(0, 15).forEach((type) => {
      console.log(`   - ${type}`);
    });

    return { usedTypes, unusedTypes, typeUsage };
  } catch (error) {
    console.error("❌ Failed to analyze:", error.message);
    return {
      usedTypes: [],
      unusedTypes: DEFINED_NOTIFICATION_TYPES,
      typeUsage: {},
    };
  }
}

async function testUnusedNotificationTypes(unusedTypes) {
  console.log("\n🧪 TESTING UNUSED NOTIFICATION TYPES");
  console.log("=".repeat(60));

  if (unusedTypes.length === 0) {
    console.log("🎉 All notification types are already in use!");
    return 0;
  }

  const beforeCount = await getNotificationCount();

  // Test a selection of unused types to see if they work
  const testTypes = [
    {
      type: "game_starts_soon",
      data: {
        game: { name: "Tennis" },
        location: "Central Court",
        scheduledAt: new Date(),
      },
    },
    {
      type: "submit_game_results",
      data: { match: "Tennis Match", deadline: "1 hour" },
    },
    {
      type: "player_rated_you",
      data: { rating: 5, reviewer: "Test Player" },
    },
    {
      type: "waitlist_spot_available",
      data: { game: { name: "Padel" }, position: 1 },
    },
    {
      type: "venue_change",
      data: {
        newLocation: "New Court",
        oldLocation: "Old Court",
        game: { name: "Tennis" },
      },
    },
    {
      type: "team_shuffle_alert",
      data: { reason: "Player cancellation" },
    },
    {
      type: "missing_player_alert",
      data: { missingPlayers: "1", game: { name: "Basketball" } },
    },
    {
      type: "marked_no_show",
      data: { match: "Tennis Match", penalty: "Warning issued" },
    },
    {
      type: "profile_image_rejected",
      data: { reason: "Not clear enough" },
    },
    {
      type: "booking_error",
      data: { error: "Payment processing failed", action: "Retry payment" },
    },
  ];

  // Only test types that are actually unused
  const typesToTest = testTypes.filter((test) =>
    unusedTypes.includes(test.type)
  );

  let successCount = 0;
  let failedTypes = [];

  console.log(`🎯 Testing ${typesToTest.length} unused notification types...`);

  for (const testNotif of typesToTest) {
    try {
      console.log(`\n🔔 Testing ${testNotif.type}...`);

      const notificationData = {
        userId: userId,
        type: testNotif.type,
        data: testNotif.data,
        redirectLink: "https://example.com/test",
      };

      await axios.post(
        `${API_BASE_URL}/notifications`,
        notificationData,
        authRequest(adminToken)
      );
      console.log(`✅ ${testNotif.type}: SUCCESS`);
      successCount++;

      await wait(300);
    } catch (error) {
      console.log(
        `❌ ${testNotif.type}: FAILED - ${
          error.response?.data?.error || error.message
        }`
      );
      failedTypes.push(testNotif.type);
    }
  }

  await wait(1000);
  const afterCount = await getNotificationCount();
  const newNotifications = afterCount - beforeCount;

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful: ${successCount}/${typesToTest.length}`);
  console.log(`   📬 New notifications created: ${newNotifications}`);

  if (failedTypes.length > 0) {
    console.log(`   ❌ Failed types: ${failedTypes.join(", ")}`);
  }

  return successCount;
}

async function getNotificationCount() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(userToken)
    );
    return (response.data.notifications || response.data || []).length;
  } catch (error) {
    return 0;
  }
}

async function testBusinessLogicIntegration() {
  console.log("\n🏗️  TESTING BUSINESS LOGIC INTEGRATION");
  console.log("=".repeat(60));

  const TENNIS_GAME_ID = "cmesf5pnt0004te3orzv8rhzr";

  const beforeCount = await getNotificationCount();

  try {
    // Test workflow that should trigger notifications
    console.log("\n🏆 Creating match to test integrated notifications...");

    const matchData = {
      gameId: TENNIS_GAME_ID,
      location: {
        name: "Integration Test Court",
        longitude: -0.1276,
        latitude: 51.5074,
        city: "London",
        country: "UK",
      },
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      maxPlayers: 2,
      pricePerUser: 15.0,
      durationMins: 90,
    };

    const matchResponse = await axios.post(
      `${API_BASE_URL}/matches`,
      matchData,
      authRequest(userToken)
    );
    const match = matchResponse.data.match;
    console.log(`✅ Match created: ${match.id}`);

    await wait(1000);

    // Cancel the match to clean up and test cancellation notifications
    console.log("\n🚫 Canceling match to test cancellation workflow...");
    await axios.post(
      `${API_BASE_URL}/matches/${match.id}/cancel`,
      {
        cancellationReason: "WEATHER",
        customCancellationReason: "Testing business logic integration",
      },
      authRequest(userToken)
    );
    console.log("✅ Match canceled");

    await wait(1000);

    const afterCount = await getNotificationCount();
    const newNotifications = afterCount - beforeCount;

    console.log(`📊 Business logic created ${newNotifications} notifications`);

    return newNotifications;
  } catch (error) {
    console.error(
      `❌ Business logic test failed: ${error.response?.data || error.message}`
    );
    return 0;
  }
}

async function showNotificationsSample() {
  console.log("\n📬 LATEST NOTIFICATIONS SAMPLE");
  console.log("=".repeat(50));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(userToken)
    );
    const notifications = response.data.notifications || response.data || [];

    const latest = notifications.slice(0, 6);

    latest.forEach((notif, index) => {
      console.log(`${index + 1}. "${notif.title}"`);
      console.log(
        `   Type: ${notif.type} | Category: ${notif.category} | Urgency: ${notif.urgency}`
      );
      console.log(`   Time: ${new Date(notif.createdAt).toLocaleTimeString()}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to show notifications:", error.message);
  }
}

async function runAccurateNotificationTests() {
  console.log("🎯 ACCURATE NOTIFICATION SYSTEM TESTING");
  console.log("=".repeat(70));
  console.log(
    `Testing ${DEFINED_NOTIFICATION_TYPES.length} actually defined notification types...\n`
  );

  try {
    await setupAuth();

    // Analyze current usage
    const analysis = await analyzeCurrentUsage();

    // Test unused notification types
    const unusedTestCount = await testUnusedNotificationTypes(
      analysis.unusedTypes
    );

    // Test business logic integration
    const businessLogicCount = await testBusinessLogicIntegration();

    // Show sample notifications
    await showNotificationsSample();

    // Final summary
    console.log("\n🏁 ACCURATE TESTING RESULTS");
    console.log("=".repeat(70));

    const coverage = Math.round(
      (analysis.usedTypes.length / DEFINED_NOTIFICATION_TYPES.length) * 100
    );

    console.log(`📊 Notification System Statistics:`);
    console.log(
      `   📝 Total defined types: ${DEFINED_NOTIFICATION_TYPES.length}`
    );
    console.log(`   ✅ Types in use: ${analysis.usedTypes.length}`);
    console.log(`   💤 Unused types: ${analysis.unusedTypes.length}`);
    console.log(`   📈 Coverage: ${coverage}%`);
    console.log(`   🧪 Unused types tested: ${unusedTestCount} successful`);
    console.log(
      `   🏗️  Business logic integration: ${businessLogicCount} notifications`
    );

    if (coverage >= 70) {
      console.log("\n🎉 EXCELLENT! Most notification types are actively used!");
    } else if (coverage >= 50) {
      console.log("\n👍 GOOD! Many notification types are working.");
    } else {
      console.log(
        "\n⚠️  Opportunity to integrate more notification types into workflows."
      );
    }

    console.log("\n💡 INSIGHTS:");
    console.log(
      `   • ${analysis.usedTypes.length} types are integrated into business logic`
    );
    console.log(
      `   • ${unusedTestCount} unused types work when called directly`
    );
    console.log(
      `   • ${
        analysis.unusedTypes.length - unusedTestCount
      } types may need integration work`
    );

    // Show the most active notification types
    const topTypes = Object.entries(analysis.typeUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    console.log("\n🔥 Most Active Notification Types:");
    topTypes.forEach(([type, count], index) => {
      console.log(`   ${index + 1}. ${type} (${count} notifications)`);
    });
  } catch (error) {
    console.error("\n💥 Accurate test suite failed:", error.message);
  }
}

runAccurateNotificationTests();
