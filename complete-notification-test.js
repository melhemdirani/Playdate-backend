#!/usr/bin/env node

/**
 * COMPLETE NOTIFICATION SYSTEM TESTING
 *
 * This script tests ALL notification types to see which ones are:
 * - Working in real business logic
 * - Available but not triggered
 * - Need integration fixes
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

// All notification types from your system
const ALL_NOTIFICATION_TYPES = [
  // MATCH notifications
  "match_created",
  "match_updated",
  "match_cancelled",
  "match_reminder_1_hour",
  "match_reminder_15_min",
  "match_reminder_30_min",
  "match_starting_soon",
  "match_started",
  "match_completed",
  "match_full",
  "new_player_joined",
  "player_left_match",
  "match_request_received",
  "match_request_approved",
  "match_request_declined",
  "match_invitation_received",
  "match_invitation_accepted",
  "match_invitation_declined",
  "game_suggested",
  "booking_confirmation",
  "booking_cancelled",
  "booking_updated",
  "game_cancelled_low_attendance",
  "admin_cancelled_booking",
  "match_rescheduled",
  "waitlist_spot_available",
  "match_auto_cancelled",
  "match_payment_required",

  // PAYMENT notifications
  "payment_successful",
  "payment_failed",
  "refund_processed",
  "payment_reminder",

  // BEHAVIOR notifications
  "suspicious_activity",
  "account_suspended",
  "account_unsuspended",
  "account_banned",
  "account_unbanned",
  "community_violation",
  "warning_issued",
  "final_warning",
  "account_under_review",
  "verification_required",

  // PROGRESS notifications
  "achievement_unlocked",
  "level_up",
  "milestone_reached",

  // FEEDBACK notifications
  "rating_received",
  "review_request",
];

let adminToken = "";
let userToken = "";
let user2Token = "";
let userId = "";
let user2Id = "";

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

    // Login or create user 2
    try {
      const user2Response = await axios.post(`${API_BASE_URL}/users/login`, {
        email: "test2@example.com",
        password: "password123",
      });
      user2Token = user2Response.data.accessToken;
      user2Id = user2Response.data.user.id;
      console.log("✅ User 2 logged in");
    } catch (error) {
      console.log("ℹ️  User 2 already set up from previous tests");
    }
  } catch (error) {
    console.error(
      "❌ Authentication failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getNotificationCount(token) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(token)
    );
    return (response.data.notifications || response.data || []).length;
  } catch (error) {
    return 0;
  }
}

async function analyzeNotificationTypes() {
  console.log("\n📊 ANALYZING EXISTING NOTIFICATION TYPES");
  console.log("=".repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(userToken)
    );
    const notifications = response.data.notifications || response.data || [];

    const typeUsage = {};
    const categoryUsage = {};
    const urgencyUsage = {};

    notifications.forEach((notif) => {
      typeUsage[notif.type] = (typeUsage[notif.type] || 0) + 1;
      categoryUsage[notif.category] = (categoryUsage[notif.category] || 0) + 1;
      urgencyUsage[notif.urgency] = (urgencyUsage[notif.urgency] || 0) + 1;
    });

    console.log(`📬 Total notifications analyzed: ${notifications.length}`);

    console.log("\n🔍 Notification Types in Use:");
    Object.entries(typeUsage)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} notifications`);
      });

    console.log("\n📂 Category Distribution:");
    Object.entries(categoryUsage).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} notifications`);
    });

    console.log("\n⚡ Urgency Distribution:");
    Object.entries(urgencyUsage).forEach(([urgency, count]) => {
      console.log(`   ${urgency}: ${count} notifications`);
    });

    // Find unused notification types
    const usedTypes = Object.keys(typeUsage);
    const unusedTypes = ALL_NOTIFICATION_TYPES.filter(
      (type) => !usedTypes.includes(type)
    );

    console.log(
      `\n✅ Types Currently Used: ${usedTypes.length}/${ALL_NOTIFICATION_TYPES.length}`
    );
    console.log(`❌ Types Not Yet Used: ${unusedTypes.length}`);

    if (unusedTypes.length > 0 && unusedTypes.length <= 10) {
      console.log("\n🔍 Unused Notification Types:");
      unusedTypes.forEach((type) => console.log(`   - ${type}`));
    }

    return { usedTypes, unusedTypes, typeUsage };
  } catch (error) {
    console.error("❌ Failed to analyze notifications:", error.message);
    return {
      usedTypes: [],
      unusedTypes: ALL_NOTIFICATION_TYPES,
      typeUsage: {},
    };
  }
}

async function testDirectNotificationCreation() {
  console.log("\n🧪 TESTING: Direct Notification Creation for All Types");
  console.log("=".repeat(70));

  const beforeCount = await getNotificationCount(userToken);
  console.log(`📊 Starting notification count: ${beforeCount}`);

  // Test a few key notification types that might not be triggered naturally
  const testTypes = [
    {
      type: "payment_failed",
      data: { amount: 25.0, reason: "Insufficient funds" },
    },
    {
      type: "achievement_unlocked",
      data: {
        achievement: "First Match Creator",
        description: "Created your first match",
      },
    },
    {
      type: "level_up",
      data: { newLevel: 2, previousLevel: 1 },
    },
    {
      type: "rating_received",
      data: { rating: 5, reviewer: "Test Player", match: "Tennis Match" },
    },
    {
      type: "match_reminder_1_hour",
      data: {
        game: { name: "Tennis" },
        location: "Central Court",
        scheduledAt: new Date(),
      },
    },
  ];

  let successCount = 0;

  for (const testNotif of testTypes) {
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
      console.log(`✅ ${testNotif.type}: Created successfully`);
      successCount++;

      await wait(500);
    } catch (error) {
      console.log(
        `❌ ${testNotif.type}: Failed - ${
          error.response?.data?.error || error.message
        }`
      );
    }
  }

  await wait(1000);
  const afterCount = await getNotificationCount(userToken);
  const newNotifications = afterCount - beforeCount;

  console.log(
    `\n📊 Results: ${successCount}/${testTypes.length} types created successfully`
  );
  console.log(`📬 New notifications: ${newNotifications}`);

  return successCount;
}

async function testMatchWorkflows() {
  console.log("\n🧪 TESTING: Match-Related Notification Workflows");
  console.log("=".repeat(70));

  const TENNIS_GAME_ID = "cmesf5pnt0004te3orzv8rhzr";

  try {
    const beforeCount = await getNotificationCount(userToken);

    // Test 1: Create a match
    console.log("\n🏆 Creating match to test workflow notifications...");
    const matchData = {
      gameId: TENNIS_GAME_ID,
      location: {
        name: "Test Court",
        longitude: -0.1276,
        latitude: 51.5074,
        city: "London",
        country: "UK",
      },
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      maxPlayers: 4,
      pricePerUser: 20.0,
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

    // Test 2: Join match (if user2 exists)
    if (user2Token) {
      console.log("\n👥 Testing player join workflow...");
      await axios.post(
        `${API_BASE_URL}/matches/${match.id}/join`,
        {},
        authRequest(user2Token)
      );
      console.log("✅ Player joined match");
      await wait(1000);
    }

    // Test 3: Update match
    console.log("\n📝 Testing match update workflow...");
    try {
      await axios.put(
        `${API_BASE_URL}/matches/${match.id}`,
        {
          pricePerUser: 25.0,
        },
        authRequest(userToken)
      );
      console.log("✅ Match updated");
      await wait(1000);
    } catch (error) {
      console.log(`ℹ️  Match update not available: ${error.response?.status}`);
    }

    // Test 4: Cancel match
    console.log("\n🚫 Testing match cancellation workflow...");
    await axios.post(
      `${API_BASE_URL}/matches/${match.id}/cancel`,
      {
        cancellationReason: "WEATHER",
        customCancellationReason: "Testing notification workflows",
      },
      authRequest(userToken)
    );
    console.log("✅ Match cancelled");

    await wait(1500);

    const afterCount = await getNotificationCount(userToken);
    const newNotifications = afterCount - beforeCount;

    console.log(`📊 Match workflow created ${newNotifications} notifications`);
    return newNotifications;
  } catch (error) {
    console.error(
      "❌ Match workflow test failed:",
      error.response?.data || error.message
    );
    return 0;
  }
}

async function testPaymentWorkflows() {
  console.log("\n🧪 TESTING: Payment-Related Notification Workflows");
  console.log("=".repeat(70));

  try {
    // Get user payments to test refund workflow
    const paymentsResponse = await axios.get(
      `${API_BASE_URL}/users/payments`,
      authRequest(userToken)
    );
    const payments = paymentsResponse.data || [];

    console.log(`💳 Found ${payments.length} payments for testing`);

    if (payments.length > 0) {
      const beforeCount = await getNotificationCount(userToken);

      const payment = payments[0];
      console.log(`💰 Testing refund for payment: ${payment.id}`);

      try {
        await axios.post(
          `${API_BASE_URL}/admin/payments/${payment.id}/refund`,
          {
            amount: Math.min(payment.amount, 10.0), // Refund small amount
            reason: "Testing payment notification workflows",
          },
          authRequest(adminToken)
        );

        console.log("✅ Refund processed");
        await wait(1500);

        const afterCount = await getNotificationCount(userToken);
        const newNotifications = afterCount - beforeCount;

        console.log(
          `📊 Payment workflow created ${newNotifications} notifications`
        );
        return newNotifications;
      } catch (error) {
        console.log(
          `❌ Refund test failed: ${
            error.response?.data?.error || error.message
          }`
        );
        return 0;
      }
    } else {
      console.log("ℹ️  No payments available for testing");
      return 0;
    }
  } catch (error) {
    console.error("❌ Payment workflow test failed:", error.message);
    return 0;
  }
}

async function testAdminWorkflows() {
  console.log("\n🧪 TESTING: Admin Action Notification Workflows");
  console.log("=".repeat(70));

  try {
    const beforeCount = await getNotificationCount(userToken);

    // Test 1: User status changes
    console.log("\n⚠️  Testing user status change notifications...");

    // Suspend user
    await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        status: "SUSPENDED",
      },
      authRequest(adminToken)
    );
    console.log("✅ User suspended");

    await wait(1000);

    // Unsuspend user
    await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        status: "ACCEPTED",
      },
      authRequest(adminToken)
    );
    console.log("✅ User unsuspended");

    await wait(1000);

    // Test 2: Create admin notification
    console.log("\n📢 Testing admin direct notification creation...");
    await axios.post(
      `${API_BASE_URL}/notifications`,
      {
        userId: userId,
        type: "community_violation",
        data: { reason: "Testing admin notifications", severity: "minor" },
        redirectLink: "https://example.com/community-guidelines",
      },
      authRequest(adminToken)
    );
    console.log("✅ Admin notification created");

    await wait(1000);

    const afterCount = await getNotificationCount(userToken);
    const newNotifications = afterCount - beforeCount;

    console.log(`📊 Admin workflows created ${newNotifications} notifications`);
    return newNotifications;
  } catch (error) {
    console.error(
      "❌ Admin workflow test failed:",
      error.response?.data || error.message
    );
    return 0;
  }
}

async function showLatestNotifications(count = 5) {
  console.log("\n📬 LATEST NOTIFICATIONS SAMPLE");
  console.log("=".repeat(50));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(userToken)
    );
    const notifications = response.data.notifications || response.data || [];

    const latest = notifications.slice(0, count);

    latest.forEach((notif, index) => {
      console.log(`${index + 1}. "${notif.title}"`);
      console.log(`   "${notif.subtitle}"`);
      console.log(
        `   Type: ${notif.type} | Category: ${notif.category} | Urgency: ${notif.urgency}`
      );
      console.log(`   Created: ${new Date(notif.createdAt).toLocaleString()}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to show latest notifications:", error.message);
  }
}

async function runCompleteNotificationTests() {
  console.log("🚀 COMPLETE NOTIFICATION SYSTEM TESTING");
  console.log("=".repeat(80));
  console.log("Testing ALL notification types and workflows...\n");

  try {
    await setupAuth();

    // Analyze what's currently in use
    const analysis = await analyzeNotificationTypes();

    // Test various workflows
    const directTestCount = await testDirectNotificationCreation();
    const matchWorkflowCount = await testMatchWorkflows();
    const paymentWorkflowCount = await testPaymentWorkflows();
    const adminWorkflowCount = await testAdminWorkflows();

    // Show sample of latest notifications
    await showLatestNotifications(8);

    // Final summary
    console.log("\n🏁 COMPLETE NOTIFICATION TESTING RESULTS");
    console.log("=".repeat(80));
    console.log(
      `📊 Total notification types available: ${ALL_NOTIFICATION_TYPES.length}`
    );
    console.log(`✅ Types currently in use: ${analysis.usedTypes.length}`);
    console.log(`❌ Types not yet used: ${analysis.unusedTypes.length}`);
    console.log(`🧪 Direct creation tests: ${directTestCount}/5 successful`);
    console.log(
      `🏆 Match workflow notifications: ${matchWorkflowCount} created`
    );
    console.log(
      `💳 Payment workflow notifications: ${paymentWorkflowCount} created`
    );
    console.log(
      `👨‍💼 Admin workflow notifications: ${adminWorkflowCount} created`
    );

    const coverage = Math.round(
      (analysis.usedTypes.length / ALL_NOTIFICATION_TYPES.length) * 100
    );
    console.log(`\n📈 Notification System Coverage: ${coverage}%`);

    if (coverage >= 80) {
      console.log(
        "\n🎉 EXCELLENT! Most notification types are integrated and working!"
      );
    } else if (coverage >= 60) {
      console.log(
        "\n👍 GOOD! Majority of notifications are working, some could use more integration."
      );
    } else {
      console.log(
        "\n⚠️  Many notification types available but not yet integrated into workflows."
      );
    }

    console.log("\n💡 RECOMMENDATION:");
    if (analysis.unusedTypes.length <= 10) {
      console.log("Focus on integrating these remaining notification types:");
      analysis.unusedTypes
        .slice(0, 5)
        .forEach((type) => console.log(`   - ${type}`));
    } else {
      console.log(
        "Consider prioritizing the most important notification types for integration."
      );
    }
  } catch (error) {
    console.error("\n💥 Complete test suite failed:", error.message);
  }
}

runCompleteNotificationTests();
