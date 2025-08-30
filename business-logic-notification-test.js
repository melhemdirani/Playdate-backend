#!/usr/bin/env node

/**
 * BUSINESS LOGIC NOTIFICATION TESTING
 *
 * Tests if actual business workflows trigger notifications:
 * - Match creation → notifications
 * - Player actions → notifications
 * - Admin actions → notifications
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

// Existing game IDs from your system
const TENNIS_GAME_ID = "cmesf5pnt0004te3orzv8rhzr";
const PADEL_GAME_ID = "cmesf5l5o0002te3ovl53nuax";

let adminToken = "";
let userToken = "";
let userId = "";
let user2Token = "";
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

    // Try to get second user or create one
    try {
      const user2Response = await axios.post(`${API_BASE_URL}/users/login`, {
        email: "test2@example.com",
        password: "password123",
      });
      user2Token = user2Response.data.accessToken;
      user2Id = user2Response.data.user.id;
      console.log("✅ User 2 logged in");
    } catch (error) {
      // Create user 2 if doesn't exist
      const createUser2 = await axios.post(`${API_BASE_URL}/users`, {
        name: "Test User 2",
        email: "test2@example.com",
        password: "password123",
        phoneNumber: "+1234567892",
        age: 26,
        gender: "FEMALE",
        birthdate: "1998-01-01",
      });
      user2Token = createUser2.data.accessToken;
      user2Id = createUser2.data.user?.id || createUser2.data.id;
      console.log("✅ User 2 created and logged in");
    }
  } catch (error) {
    console.error(
      "❌ Authentication failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getNotificationCount(token, userDesc) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(token)
    );
    const notifications = response.data.notifications || response.data || [];
    console.log(`📬 ${userDesc}: ${notifications.length} notifications`);
    return notifications.length;
  } catch (error) {
    console.error(
      `❌ Failed to get notifications for ${userDesc}:`,
      error.response?.data || error.message
    );
    return 0;
  }
}

async function showLatestNotifications(token, userDesc, count = 2) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(token)
    );
    const notifications = response.data.notifications || response.data || [];

    if (notifications.length > 0) {
      console.log(
        `   Latest ${Math.min(count, notifications.length)} notifications:`
      );
      notifications.slice(0, count).forEach((notif, index) => {
        console.log(`   ${index + 1}. "${notif.title}" - ${notif.subtitle}`);
        console.log(
          `      Type: ${notif.type} | Category: ${notif.category} | Urgency: ${notif.urgency}`
        );
      });
    }

    return notifications;
  } catch (error) {
    console.error(
      `❌ Failed to get notifications for ${userDesc}:`,
      error.response?.data || error.message
    );
    return [];
  }
}

async function testRealMatchCreation() {
  console.log("\n🧪 TEST: Real Match Creation Business Logic");
  console.log("=".repeat(60));

  try {
    // Get baseline notification counts
    const beforeUser1 = await getNotificationCount(
      userToken,
      "User 1 (creator)"
    );
    const beforeUser2 = await getNotificationCount(user2Token, "User 2");

    console.log("\n🏆 Creating real tennis match...");
    const matchData = {
      gameId: TENNIS_GAME_ID,
      location: {
        name: "Central Tennis Court",
        longitude: -0.1276,
        latitude: 51.5074,
        city: "London",
        country: "UK",
      },
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      maxPlayers: 4,
      pricePerUser: 15.0,
      durationMins: 120,
    };

    const matchResponse = await axios.post(
      `${API_BASE_URL}/matches`,
      matchData,
      authRequest(userToken)
    );
    const match = matchResponse.data.match;
    console.log(`✅ Match created: ${match.id}`);

    await wait(1500); // Wait for any async notification processing

    // Check if notifications were triggered
    console.log("\n📊 Post-creation notification counts:");
    const afterUser1 = await getNotificationCount(
      userToken,
      "User 1 (creator)"
    );
    const afterUser2 = await getNotificationCount(user2Token, "User 2");

    const user1NewNotifs = afterUser1 - beforeUser1;
    const user2NewNotifs = afterUser2 - beforeUser2;

    console.log(`🔔 User 1 new notifications: ${user1NewNotifs}`);
    console.log(`🔔 User 2 new notifications: ${user2NewNotifs}`);

    if (user1NewNotifs > 0) {
      console.log("\n📬 User 1 latest notifications:");
      await showLatestNotifications(userToken, "User 1", 2);
    }

    return { match, user1NewNotifs, user2NewNotifs };
  } catch (error) {
    console.error(
      "❌ Match creation test failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testPlayerJoinWorkflow(match) {
  console.log("\n🧪 TEST: Player Join Business Logic");
  console.log("=".repeat(60));

  if (!match) {
    console.log("❌ No match available for join test");
    return false;
  }

  try {
    // Get baseline counts
    const beforeUser1 = await getNotificationCount(
      userToken,
      "User 1 (creator)"
    );
    const beforeUser2 = await getNotificationCount(
      user2Token,
      "User 2 (joiner)"
    );

    console.log(`\n👥 User 2 joining match ${match.id}...`);
    await axios.post(
      `${API_BASE_URL}/matches/${match.id}/join`,
      {},
      authRequest(user2Token)
    );
    console.log("✅ User 2 joined the match");

    await wait(1500); // Wait for notifications

    console.log("\n📊 Post-join notification counts:");
    const afterUser1 = await getNotificationCount(
      userToken,
      "User 1 (creator)"
    );
    const afterUser2 = await getNotificationCount(
      user2Token,
      "User 2 (joiner)"
    );

    const user1NewNotifs = afterUser1 - beforeUser1;
    const user2NewNotifs = afterUser2 - beforeUser2;

    console.log(`🔔 Creator new notifications: ${user1NewNotifs}`);
    console.log(`🔔 Joiner new notifications: ${user2NewNotifs}`);

    if (user1NewNotifs > 0) {
      console.log("\n📬 Creator latest notifications:");
      await showLatestNotifications(userToken, "Creator", 2);
    }

    if (user2NewNotifs > 0) {
      console.log("\n📬 Joiner latest notifications:");
      await showLatestNotifications(user2Token, "Joiner", 2);
    }

    return user1NewNotifs > 0 || user2NewNotifs > 0;
  } catch (error) {
    console.error(
      "❌ Player join test failed:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function testAdminCancelMatch(match) {
  console.log("\n🧪 TEST: Admin Cancel Match Business Logic");
  console.log("=".repeat(60));

  if (!match) {
    console.log("❌ No match available for cancel test");
    return false;
  }

  try {
    // Get baseline counts for both users
    const beforeUser1 = await getNotificationCount(userToken, "User 1");
    const beforeUser2 = await getNotificationCount(user2Token, "User 2");

    console.log(
      `\n🔨 Admin canceling match ${match.id} with proper cancellation...`
    );

    // Use the proper cancellation endpoint that sends notifications
    // Instead of DELETE, we should use the cancel endpoint with admin reason
    await axios.post(
      `${API_BASE_URL}/matches/${match.id}/cancel`,
      {
        cancellationReason: "ADMIN_CANCELLED",
        customCancellationReason: "Testing admin cancellation notifications",
      },
      authRequest(adminToken)
    );

    console.log("✅ Admin canceled the match using proper cancellation");

    await wait(2000); // Wait longer for cancellation notifications

    console.log("\n📊 Post-cancellation notification counts:");
    const afterUser1 = await getNotificationCount(userToken, "User 1");
    const afterUser2 = await getNotificationCount(user2Token, "User 2");

    const user1NewNotifs = afterUser1 - beforeUser1;
    const user2NewNotifs = afterUser2 - beforeUser2;

    console.log(`🔔 User 1 new notifications: ${user1NewNotifs}`);
    console.log(`🔔 User 2 new notifications: ${user2NewNotifs}`);

    if (user1NewNotifs > 0) {
      console.log("\n📬 User 1 latest notifications:");
      await showLatestNotifications(userToken, "User 1", 2);
    }

    if (user2NewNotifs > 0) {
      console.log("\n📬 User 2 latest notifications:");
      await showLatestNotifications(user2Token, "User 2", 2);
    }

    return user1NewNotifs > 0 || user2NewNotifs > 0;
  } catch (error) {
    console.error(
      "❌ Admin cancel test failed:",
      error.response?.data || error.message
    );
    console.log("ℹ️  Trying alternative admin cancellation method...");

    try {
      // Fallback: If the cancel endpoint doesn't work for admin,
      // try using the match creator's token but with admin reason
      await axios.post(
        `${API_BASE_URL}/matches/${match.id}/cancel`,
        {
          cancellationReason: "ADMIN_CANCELLED",
          customCancellationReason: "admin cancelled - testing notifications",
        },
        authRequest(userToken)
      );

      await wait(2000);

      const finalUser1 = await getNotificationCount(userToken, "User 1");
      const finalUser2 = await getNotificationCount(user2Token, "User 2");

      const user1CancelNotifs = finalUser1 - beforeUser1;
      const user2CancelNotifs = finalUser2 - beforeUser2;

      console.log(
        `🔔 Final notification counts - User 1: ${user1CancelNotifs}, User 2: ${user2CancelNotifs}`
      );

      if (user1CancelNotifs > 0) {
        console.log("\n📬 User 1 cancellation notifications:");
        await showLatestNotifications(userToken, "User 1", 2);
      }

      if (user2CancelNotifs > 0) {
        console.log("\n📬 User 2 cancellation notifications:");
        await showLatestNotifications(user2Token, "User 2", 2);
      }

      return user1CancelNotifs > 0 || user2CancelNotifs > 0;
    } catch (fallbackError) {
      console.error(
        "❌ Fallback cancellation also failed:",
        fallbackError.response?.data || fallbackError.message
      );
      return false;
    }
  }
}

async function testAdminUserActions() {
  console.log("\n🧪 TEST: Admin User Status Change Business Logic");
  console.log("=".repeat(60));

  try {
    const beforeCount = await getNotificationCount(userToken, "User 1");

    console.log("\n⚠️  Admin suspending User 1...");
    await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        status: "SUSPENDED",
      },
      authRequest(adminToken)
    );
    console.log("✅ User suspended");

    await wait(1500);

    const afterSuspend = await getNotificationCount(userToken, "User 1");
    const suspendNotifs = afterSuspend - beforeCount;

    console.log(`🔔 Suspend notifications: ${suspendNotifs}`);

    if (suspendNotifs > 0) {
      console.log("\n📬 Suspend notifications:");
      await showLatestNotifications(userToken, "User 1", 1);
    }

    // Restore user
    console.log("\n🔄 Admin restoring User 1 to ACCEPTED...");
    await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        status: "ACCEPTED",
      },
      authRequest(adminToken)
    );
    console.log("✅ User restored");

    await wait(1500);

    const afterRestore = await getNotificationCount(userToken, "User 1");
    const restoreNotifs = afterRestore - afterSuspend;

    console.log(`🔔 Restore notifications: ${restoreNotifs}`);

    return suspendNotifs > 0 || restoreNotifs > 0;
  } catch (error) {
    console.error(
      "❌ Admin user action test failed:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function runBusinessLogicTests() {
  console.log("🚀 BUSINESS LOGIC NOTIFICATION TESTING");
  console.log("=".repeat(70));
  console.log("Testing if real workflows trigger notifications...\n");

  let results = {
    matchCreation: false,
    playerJoin: false,
    adminCancel: false,
    adminUserActions: false,
  };

  try {
    await setupAuth();

    // Test 1: Match Creation
    const matchResult = await testRealMatchCreation();
    if (
      matchResult &&
      (matchResult.user1NewNotifs > 0 || matchResult.user2NewNotifs > 0)
    ) {
      results.matchCreation = true;
    }

    // Test 2: Player Join (if match was created)
    if (matchResult && matchResult.match) {
      if (await testPlayerJoinWorkflow(matchResult.match)) {
        results.playerJoin = true;
      }

      // Test 3: Admin Cancel (using the same match)
      if (await testAdminCancelMatch(matchResult.match)) {
        results.adminCancel = true;
      }
    }

    // Test 4: Admin User Actions
    if (await testAdminUserActions()) {
      results.adminUserActions = true;
    }

    // Final Results
    console.log("\n🏁 BUSINESS LOGIC TEST RESULTS");
    console.log("=".repeat(70));
    console.log(
      `🏆 Match Creation Triggers Notifications: ${
        results.matchCreation ? "✅ YES" : "❌ NO"
      }`
    );
    console.log(
      `👥 Player Join Triggers Notifications: ${
        results.playerJoin ? "✅ YES" : "❌ NO"
      }`
    );
    console.log(
      `🔨 Admin Cancel Triggers Notifications: ${
        results.adminCancel ? "✅ YES" : "❌ NO"
      }`
    );
    console.log(
      `⚠️  Admin User Actions Trigger Notifications: ${
        results.adminUserActions ? "✅ YES" : "❌ NO"
      }`
    );

    const workingFeatures = Object.values(results).filter(Boolean).length;
    const totalFeatures = Object.keys(results).length;

    console.log(
      `\n📊 Overall Business Logic Integration: ${workingFeatures}/${totalFeatures} (${Math.round(
        (workingFeatures / totalFeatures) * 100
      )}%)`
    );

    if (workingFeatures === totalFeatures) {
      console.log(
        "\n🎉 ALL BUSINESS LOGIC WORKFLOWS ARE TRIGGERING NOTIFICATIONS!"
      );
    } else if (workingFeatures > 0) {
      console.log(
        "\n⚠️  SOME business logic workflows are working, some need attention"
      );
    } else {
      console.log(
        "\n❌ NO business logic workflows are triggering notifications - needs investigation"
      );
    }
  } catch (error) {
    console.error("\n💥 Business logic test suite failed:", error.message);
  }
}

runBusinessLogicTests();
