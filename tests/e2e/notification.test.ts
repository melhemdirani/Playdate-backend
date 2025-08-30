import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { registerAndLoginUser } from './test-utils';

const API_BASE_URL = 'http://localhost:4000';
const NOTIFICATION_API_BASE_URL = `${API_BASE_URL}/notifications`;

describe.skip('Notification Endpoints', () => {
  let userToken: string;
  let userId: string;
  let createdNotificationId: string;

  beforeAll(async () => {
    // Ensure the server is running
    try {
      await axios.get(API_BASE_URL);
    } catch (error) {
      console.error('API is not reachable. Please ensure your server is running on port 4000.');
      process.exit(1);
    }

    // Register and login a user for testing
    const { user, token } = await registerAndLoginUser();
    userToken = token;
    userId = user.id;
  });

  it('should create a new notification', async () => {
    const notificationData = {
      recipientId: userId, // Assuming the notification is for the logged-in user
      type: 'MATCH_REMINDER', // Example type, adjust based on your schema
      message: 'Your match is starting soon!',
      // Add other required fields for notification creation based on notificationSchema.ts
    };

    const response = await axios.post(NOTIFICATION_API_BASE_URL, notificationData, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    expect(response.status).toBe(201); // Assuming 201 Created status
    expect(response.data).toBeDefined();
    expect(response.data.notification).toBeDefined();
    expect(response.data.notification.recipientId).toBe(notificationData.recipientId);
    createdNotificationId = response.data.notification.id;
  });

  it('should get user notifications', async () => {
    const response = await axios.get(NOTIFICATION_API_BASE_URL, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.notifications)).toBe(true);
    expect(response.data.notifications.length).toBeGreaterThan(0);
  });

  it('should mark a notification as seen', async () => {
    const response = await axios.patch(`${NOTIFICATION_API_BASE_URL}/${createdNotificationId}/seen`, {}, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.data.msg).toBe('Notification marked as seen');
    // Optionally, verify the notification is indeed marked as seen by fetching it again
  });

  it('should delete a notification', async () => {
    const response = await axios.delete(`${NOTIFICATION_API_BASE_URL}/${createdNotificationId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.data.msg).toBe('Notification deleted');
    // Optionally, verify the notification is no longer retrievable
  });
});
