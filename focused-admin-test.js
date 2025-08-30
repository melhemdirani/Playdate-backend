#!/usr/bin/env node

/**
 * FOCUSED ADMIN ACTION NOTIFICATION TESTING
 * Tests specific admin actions that should trigger notifications
 */

const axios = require("axios");

const API_BASE_URL = "http://localhost:4000";

const ADMIN_CREDS = {
  email: "admin1@admin.admin",
  password: "Admin1234",
};

const TEST_USER_CREDS = {
  email: "test@example.com",
  password: "password123",
};

let adminToken = "";
let userToken = "";
let userId = "";

const authRequest = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup() {
  console.log("🔑 Setting up authentication...");

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
  console.log("User ID:", userId);
}

async function countNotifications() {
  const response = await axios.get(
    `${API_BASE_URL}/notifications`,
    authRequest(userToken)
  );
  return response.data.notifications?.length || response.data?.length || 0;
}

async function getLatestNotifications(count = 3) {
  const response = await axios.get(
    `${API_BASE_URL}/notifications`,
    authRequest(userToken)
  );
  const notifications = response.data.notifications || response.data || [];
  return notifications.slice(0, count);
}

async function testAdminUserStatusChanges() {
  console.log("\n🧪 TEST: Admin User Status Changes");
  console.log("=".repeat(50));

  const initialCount = await countNotifications();
  console.log(`📊 Initial notification count: ${initialCount}`);

  try {
    // Test 1: Suspend user
    console.log("\n1️⃣ Admin suspending user...");
    await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        status: "SUSPENDED",
      },
      authRequest(adminToken)
    );

    await wait(1000);

    const afterSuspend = await countNotifications();
    console.log(
      `📊 After suspend: ${afterSuspend} notifications (+${
        afterSuspend - initialCount
      })`
    );

    // Show latest notifications
    const latestAfterSuspend = await getLatestNotifications(2);
    latestAfterSuspend.forEach((notif, i) => {
      console.log(`   ${i + 1}. ${notif.title} - ${notif.type}`);
    });

    // Test 2: Ban user
    console.log("\n2️⃣ Admin banning user...");
    await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        status: "BANNED",
      },
      authRequest(adminToken)
    );

    await wait(1000);

    const afterBan = await countNotifications();
    console.log(
      `📊 After ban: ${afterBan} notifications (+${afterBan - initialCount})`
    );

    // Test 3: Restore user
    console.log("\n3️⃣ Admin restoring user...");
    await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        status: "ACCEPTED",
      },
      authRequest(adminToken)
    );

    await wait(1000);

    const finalCount = await countNotifications();
    console.log(
      `📊 Final count: ${finalCount} notifications (+${
        finalCount - initialCount
      } total new)`
    );

    // Show all new notifications
    const latestNotifications = await getLatestNotifications(5);
    console.log("\n📬 Latest notifications:");
    latestNotifications.forEach((notif, i) => {
      console.log(`   ${i + 1}. ${notif.title}`);
      console.log(`      Content: ${notif.subtitle}`);
      console.log(`      Type: ${notif.type} | Urgency: ${notif.urgency}`);
      console.log("");
    });

    return finalCount - initialCount;
  } catch (error) {
    console.error(
      "❌ Admin status change test failed:",
      error.response?.data || error.message
    );
    return 0;
  }
}

async function testMatchCreationWithGame() {
  console.log("\n🧪 TEST: Match Creation with Proper Game");
  console.log("=".repeat(50));

  try {
    // First, get existing games
    const gamesResponse = await axios.get(`${API_BASE_URL}/games`);
    console.log(
      `🎮 Found ${gamesResponse.data.games?.length || 0} existing games`
    );

    let gameId;
    if (gamesResponse.data.games && gamesResponse.data.games.length > 0) {
      gameId = gamesResponse.data.games[0].id;
      console.log(`✅ Using existing game: ${gameId}`);
    } else {
      // Create a simple game
      console.log("🎮 Creating a test game...");
      const gameData = {
        name: "Test Tennis",
        description: "Tennis for testing",
        minPlayers: 2,
        maxPlayers: 4,
      };

      const gameResponse = await axios.post(`${API_BASE_URL}/games`, gameData);
      gameId = gameResponse.data.game.id;
      console.log(`✅ Created new game: ${gameId}`);
    }

    const initialCount = await countNotifications();

    // Create match
    console.log("\n🏆 Creating match...");
    const matchData = {
      gameId: gameId,
      location: "Test Court",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      maxPlayers: 4,
      description: "Test match",
    };

    const matchResponse = await axios.post(
      `${API_BASE_URL}/matches`,
      matchData,
      authRequest(userToken)
    );
    console.log(`✅ Match created: ${matchResponse.data.match?.id}`);

    await wait(1000);

    const afterCount = await countNotifications();
    console.log(
      `📊 Notifications: ${initialCount} → ${afterCount} (+${
        afterCount - initialCount
      })`
    );

    if (afterCount > initialCount) {
      const latest = await getLatestNotifications(2);
      console.log("\n📬 New notifications:");
      latest.forEach((notif, i) => {
        console.log(`   ${i + 1}. ${notif.title} - ${notif.type}`);
      });
    }

    return matchResponse.data.match;
  } catch (error) {
    console.error(
      "❌ Match creation test failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testAdminMatchActions(matchId) {
  console.log("\n🧪 TEST: Admin Match Actions");
  console.log("=".repeat(50));

  if (!matchId) {
    console.log("❌ No match ID provided for admin actions test");
    return 0;
  }

  try {
    const initialCount = await countNotifications();

    // Test admin canceling a match
    console.log("🔨 Admin canceling match...");
    await axios.delete(
      `${API_BASE_URL}/admin/matches/${matchId}`,
      authRequest(adminToken)
    );

    await wait(1000);

    const finalCount = await countNotifications();
    console.log(
      `📊 Notifications: ${initialCount} → ${finalCount} (+${
        finalCount - initialCount
      })`
    );

    if (finalCount > initialCount) {
      const latest = await getLatestNotifications(2);
      console.log("\n📬 New notifications from admin action:");
      latest.forEach((notif, i) => {
        console.log(`   ${i + 1}. ${notif.title}`);
        console.log(`      Content: ${notif.subtitle}`);
        console.log(`      Type: ${notif.type}`);
      });
    }

    return finalCount - initialCount;
  } catch (error) {
    console.error(
      "❌ Admin match actions test failed:",
      error.response?.data || error.message
    );
    return 0;
  }
}

async function testNotificationTypes() {
  console.log("\n🧪 TEST: Notification Type Analysis");
  console.log("=".repeat(50));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(userToken)
    );
    const notifications = response.data.notifications || response.data || [];

    // Analyze notification types
    const typeCount = {};
    const categoryCount = {};
    const urgencyCount = {};

    notifications.forEach((notif) => {
      typeCount[notif.type] = (typeCount[notif.type] || 0) + 1;
      categoryCount[notif.category] = (categoryCount[notif.category] || 0) + 1;
      urgencyCount[notif.urgency] = (urgencyCount[notif.urgency] || 0) + 1;
    });

    console.log(`📊 Total notifications: ${notifications.length}`);
    console.log("\n📈 By Type:");
    Object.entries(typeCount)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

    console.log("\n📈 By Category:");
    Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });

    console.log("\n📈 By Urgency:");
    Object.entries(urgencyCount)
      .sort(([, a], [, b]) => b - a)
      .forEach(([urgency, count]) => {
        console.log(`   ${urgency}: ${count}`);
      });

    // Check for business logic notifications (not just test data)
    const businessLogicTypes = ["MATCH", "PAYMENT", "BEHAVIOR"];
    const businessNotifs = notifications.filter((n) =>
      businessLogicTypes.includes(n.type)
    );

    console.log(
      `\n🏢 Business Logic Notifications: ${businessNotifs.length}/${notifications.length}`
    );

    return notifications.length;
  } catch (error) {
    console.error(
      "❌ Notification analysis failed:",
      error.response?.data || error.message
    );
    return 0;
  }
}

async function runFocusedTests() {
  console.log("🎯 FOCUSED ADMIN ACTION NOTIFICATION TESTING");
  console.log("=".repeat(60));

  try {
    await setup();

    // Run focused tests
    console.log("\n🔍 Running focused notification tests...");

    const statusChangeNotifs = await testAdminUserStatusChanges();
    const match = await testMatchCreationWithGame();
    const adminActionNotifs = await testAdminMatchActions(match?.id);
    await testNotificationTypes();

    console.log("\n🏁 FOCUSED TEST SUMMARY");
    console.log("=".repeat(40));
    console.log(`📊 Status change notifications: ${statusChangeNotifs}`);
    console.log(`📊 Admin action notifications: ${adminActionNotifs}`);

    if (statusChangeNotifs > 0 || adminActionNotifs > 0) {
      console.log("\n✅ ADMIN ACTIONS ARE TRIGGERING NOTIFICATIONS!");
    } else {
      console.log(
        "\n⚠️  Admin actions may not be triggering notifications as expected"
      );
    }
  } catch (error) {
    console.error("💥 Focused test failed:", error.message);
  }
}

runFocusedTests();
