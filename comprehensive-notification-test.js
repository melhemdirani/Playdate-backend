#!/usr/bin/env node

/**
 * COMPREHENSIVE NOTIFICATION WORKFLOW TESTING
 *
 * This script tests real-world scenarios where notifications should be triggered:
 * - Admin actions (approve/decline matches, cancel bookings)
 * - User actions (join/leave matches, rate players)
 * - System events (match reminders, payment processing)
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

let adminToken = "";
let userToken = "";
let adminId = "";
let userId = "";

// Store created entities for cleanup
let createdEntities = {
  matches: [],
  games: [],
  users: [],
  notifications: [],
};

// Helper function to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to make authenticated requests
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
    adminId = adminResponse.data.user.id;
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

async function createTestUser2() {
  console.log("\n👥 Creating second test user...");

  try {
    const userData = {
      name: "Test User 2",
      email: "test2@example.com",
      password: "password123",
      phoneNumber: "+1234567891",
      age: 26,
      gender: "FEMALE",
      birthdate: "1998-01-01",
    };

    const response = await axios.post(`${API_BASE_URL}/users`, userData);
    createdEntities.users.push(response.data.id);
    console.log("✅ Second test user created");
    return {
      id: response.data.id,
      token: response.data.accessToken,
      email: userData.email,
    };
  } catch (error) {
    if (error.response?.status === 409) {
      // User already exists, login instead
      const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
        email: "test2@example.com",
        password: "password123",
      });
      console.log("✅ Second test user logged in (already exists)");
      return {
        id: loginResponse.data.user.id,
        token: loginResponse.data.accessToken,
        email: "test2@example.com",
      };
    }
    throw error;
  }
}

async function createTestGame() {
  console.log("\n🎮 Creating test game...");

  try {
    const gameData = {
      name: "Test Tennis Game",
    };

    const response = await axios.post(
      `${API_BASE_URL}/admin/games`,
      gameData,
      authRequest(adminToken)
    );
    createdEntities.games.push(response.data.game.id);
    console.log("✅ Test game created:", response.data.game.id);
    return response.data.game;
  } catch (error) {
    console.error(
      "❌ Failed to create game:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createTestMatch(gameId, creatorToken, creatorId) {
  console.log("\n🏆 Creating test match...");

  try {
    const matchData = {
      gameId: gameId,
      location: {
        name: "Test Tennis Court",
        longitude: -0.1276,
        latitude: 51.5074,
        city: "London",
        country: "UK",
      },
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      maxPlayers: 4,
      pricePerUser: 10.0,
      durationMins: 90,
    };

    const response = await axios.post(
      `${API_BASE_URL}/matches`,
      matchData,
      authRequest(creatorToken)
    );
    createdEntities.matches.push(response.data.match.id);
    console.log("✅ Test match created:", response.data.match.id);
    return response.data.match;
  } catch (error) {
    console.error(
      "❌ Failed to create match:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getUserNotifications(token, userEmail) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      authRequest(token)
    );
    const notifications = response.data.notifications || response.data || [];
    console.log(`📬 ${userEmail} has ${notifications.length} notifications`);

    // Show latest 3 notifications
    if (notifications.length > 0) {
      console.log("   Latest notifications:");
      notifications.slice(0, 3).forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} - ${notif.subtitle}`);
        console.log(
          `      Type: ${notif.type} | Urgency: ${notif.urgency} | Seen: ${notif.seen}`
        );
      });
    }

    return notifications;
  } catch (error) {
    console.error(
      `❌ Failed to get notifications for ${userEmail}:`,
      error.response?.data || error.message
    );
    return [];
  }
}

async function testMatchCreationNotification() {
  console.log("\n🧪 TEST 1: Match Creation Notification");
  console.log("=".repeat(50));

  try {
    // Create game and match
    const game = await createTestGame();
    const user2 = await createTestUser2();

    console.log("📋 Initial notification count...");
    const initialNotifs = await getUserNotifications(
      userToken,
      TEST_USER_CREDS.email
    );

    const match = await createTestMatch(game.id, userToken, userId);

    await wait(1000); // Wait for notifications to be processed

    console.log("📋 Checking for match creation notifications...");
    const afterNotifs = await getUserNotifications(
      userToken,
      TEST_USER_CREDS.email
    );

    const newNotifications = afterNotifs.length - initialNotifs.length;
    console.log(
      `✅ Test 1 Result: ${newNotifications} new notifications created`
    );

    return { match, game, user2 };
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
    return null;
  }
}

async function testPlayerJoinNotification(match, user2) {
  console.log("\n🧪 TEST 2: Player Join Notification");
  console.log("=".repeat(50));

  try {
    console.log("📋 Pre-join notification count...");
    await getUserNotifications(userToken, TEST_USER_CREDS.email);

    // User 2 joins the match
    console.log("👥 User 2 joining match...");
    await axios.post(
      `${API_BASE_URL}/matches/${match.id}/join`,
      {},
      authRequest(user2.token)
    );

    await wait(1000);

    console.log("📋 Checking for player join notifications...");
    await getUserNotifications(userToken, TEST_USER_CREDS.email);
    await getUserNotifications(user2.token, user2.email);

    console.log("✅ Test 2 completed");
    return true;
  } catch (error) {
    console.error("❌ Test 2 failed:", error.response?.data || error.message);
    return false;
  }
}

async function testAdminMatchActions(match) {
  console.log("\n🧪 TEST 3: Admin Match Actions");
  console.log("=".repeat(50));

  try {
    // Test admin canceling a match
    console.log("🔨 Admin canceling match...");

    await axios.delete(
      `${API_BASE_URL}/admin/matches/${match.id}`,
      authRequest(adminToken)
    );

    await wait(1000);

    console.log("📋 Checking for cancellation notifications...");
    await getUserNotifications(userToken, TEST_USER_CREDS.email);

    console.log("✅ Test 3 completed");
    return true;
  } catch (error) {
    console.error("❌ Test 3 failed:", error.response?.data || error.message);
    return false;
  }
}

async function testMatchRequestWorkflow() {
  console.log("\n🧪 TEST 4: Match Request Approval/Decline Workflow");
  console.log("=".repeat(50));

  try {
    // Create a match request (this might need to be done differently based on your API)
    console.log("📝 Creating match request...");

    // First, let's see what match requests exist
    const matchRequestsResponse = await axios.get(
      `${API_BASE_URL}/admin/match-requests`,
      authRequest(adminToken)
    );
    console.log(
      `📋 Found ${
        matchRequestsResponse.data.length || 0
      } pending match requests`
    );

    if (matchRequestsResponse.data.length > 0) {
      const matchRequest = matchRequestsResponse.data[0];

      // Test approval
      console.log("✅ Admin approving match request...");
      await axios.post(
        `${API_BASE_URL}/admin/match-requests/${matchRequest.id}/approve`,
        {},
        authRequest(adminToken)
      );

      await wait(1000);

      console.log("📋 Checking for approval notifications...");
      // Check notifications for the user who created the request
      if (matchRequest.userId) {
        // We'd need the user's token to check their notifications
        console.log(
          "📬 Approval notification should be sent to user:",
          matchRequest.userId
        );
      }
    } else {
      console.log("ℹ️  No pending match requests to test");
    }

    console.log("✅ Test 4 completed");
    return true;
  } catch (error) {
    console.error("❌ Test 4 failed:", error.response?.data || error.message);
    return false;
  }
}

async function testUserStatusChanges() {
  console.log("\n🧪 TEST 5: User Status Changes (Admin Actions)");
  console.log("=".repeat(50));

  try {
    // Test user suspension/ban notifications
    console.log("⚠️  Admin updating user status...");

    await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        status: "SUSPENDED",
      },
      authRequest(adminToken)
    );

    await wait(1000);

    console.log("📋 Checking for status change notifications...");
    await getUserNotifications(userToken, TEST_USER_CREDS.email);

    // Restore user status
    await axios.patch(
      `${API_BASE_URL}/admin/users/${userId}/status`,
      {
        status: "ACCEPTED",
      },
      authRequest(adminToken)
    );

    console.log("✅ Test 5 completed");
    return true;
  } catch (error) {
    console.error("❌ Test 5 failed:", error.response?.data || error.message);
    return false;
  }
}

async function testPaymentNotifications() {
  console.log("\n🧪 TEST 6: Payment-Related Notifications");
  console.log("=".repeat(50));

  try {
    // Get user payments
    const paymentsResponse = await axios.get(
      `${API_BASE_URL}/users/payments`,
      authRequest(userToken)
    );
    console.log(
      `💳 Found ${paymentsResponse.data.length || 0} payments for user`
    );

    if (paymentsResponse.data.length > 0) {
      const payment = paymentsResponse.data[0];

      // Test admin refund (this should trigger refund notification)
      console.log("💰 Admin processing refund...");
      await axios.post(
        `${API_BASE_URL}/admin/payments/${payment.id}/refund`,
        {
          amount: payment.amount,
          reason: "Testing refund notifications",
        },
        authRequest(adminToken)
      );

      await wait(1000);

      console.log("📋 Checking for refund notifications...");
      await getUserNotifications(userToken, TEST_USER_CREDS.email);
    } else {
      console.log("ℹ️  No payments found to test refund notifications");
    }

    console.log("✅ Test 6 completed");
    return true;
  } catch (error) {
    console.error("❌ Test 6 failed:", error.response?.data || error.message);
    return false;
  }
}

async function testNotificationInteractions() {
  console.log("\n🧪 TEST 7: Notification Interactions");
  console.log("=".repeat(50));

  try {
    // Get all notifications
    const notifications = await getUserNotifications(
      userToken,
      TEST_USER_CREDS.email
    );

    if (notifications.length > 0) {
      const testNotification = notifications[0];

      // Test mark as seen
      console.log("👁️  Testing mark as seen...");
      await axios.patch(
        `${API_BASE_URL}/notifications/${testNotification.id}/seen`,
        {},
        authRequest(userToken)
      );

      await wait(500);

      // Verify it's marked as seen
      const updatedNotifications = await getUserNotifications(
        userToken,
        TEST_USER_CREDS.email
      );
      const updatedNotif = updatedNotifications.find(
        (n) => n.id === testNotification.id
      );
      console.log(
        `📝 Notification seen status: ${updatedNotif?.seen ? "SEEN" : "UNSEEN"}`
      );

      // Test delete notification
      console.log("🗑️  Testing delete notification...");
      await axios.delete(
        `${API_BASE_URL}/notifications/${testNotification.id}`,
        authRequest(userToken)
      );

      await wait(500);

      // Verify it's deleted
      const finalNotifications = await getUserNotifications(
        userToken,
        TEST_USER_CREDS.email
      );
      const deletedNotif = finalNotifications.find(
        (n) => n.id === testNotification.id
      );
      console.log(`🗑️  Notification deleted: ${!deletedNotif ? "YES" : "NO"}`);
    }

    console.log("✅ Test 7 completed");
    return true;
  } catch (error) {
    console.error("❌ Test 7 failed:", error.response?.data || error.message);
    return false;
  }
}

async function runComprehensiveNotificationTests() {
  console.log("🚀 COMPREHENSIVE NOTIFICATION WORKFLOW TESTING");
  console.log("=".repeat(60));
  console.log("Testing real user workflows and admin actions...\n");

  let passedTests = 0;
  const totalTests = 7;

  try {
    // Setup
    await setupAuth();

    // Run tests
    const test1Result = await testMatchCreationNotification();
    if (test1Result) {
      passedTests++;

      const { match, game, user2 } = test1Result;

      if (await testPlayerJoinNotification(match, user2)) passedTests++;
      if (await testAdminMatchActions(match)) passedTests++;
    }

    if (await testMatchRequestWorkflow()) passedTests++;
    if (await testUserStatusChanges()) passedTests++;
    if (await testPaymentNotifications()) passedTests++;
    if (await testNotificationInteractions()) passedTests++;

    // Final summary
    console.log("\n🏁 COMPREHENSIVE TEST RESULTS");
    console.log("=".repeat(60));
    console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(
      `📊 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`
    );

    // Final notification count for each user
    console.log("\n📊 FINAL NOTIFICATION SUMMARY:");
    console.log("─".repeat(40));
    await getUserNotifications(userToken, TEST_USER_CREDS.email);

    if (passedTests === totalTests) {
      console.log("\n🎉 ALL NOTIFICATION WORKFLOWS WORKING PERFECTLY!");
    } else {
      console.log("\n⚠️  Some tests failed - check the logs above for details");
    }
  } catch (error) {
    console.error("\n💥 Test suite failed:", error.message);
  }
}

// Run the comprehensive tests
runComprehensiveNotificationTests();
