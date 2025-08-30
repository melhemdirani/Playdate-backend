import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { registerAndLoginUser, generateUserData } from './test-utils';

const API_BASE_URL = 'http://localhost:4000';
const USERS_API_BASE_URL = `${API_BASE_URL}/users`;

describe.skip('User Endpoints', () => {
  let userToken: string;
  let userId: string;
  let userEmail: string;

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
    userEmail = user.email;
  });

  it('should get current user info', async () => {
    const response = await axios.get(`${USERS_API_BASE_URL}/get-info`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.user.id).toBe(userId);
    expect(response.data.user.email).toBe(userEmail);
  });

  it('should update user info', async () => {
    const updatedUsername = `updated_user_${Date.now()}`;
    const response = await axios.patch(USERS_API_BASE_URL, { username: updatedUsername }, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.user.username).toBe(updatedUsername);
  });

  it('should get public user info by ID', async () => {
    const response = await axios.get(`${USERS_API_BASE_URL}/${userId}`);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.user.id).toBe(userId);
  });

  it('should deactivate user account', async () => {
    const response = await axios.patch(`${USERS_API_BASE_URL}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.data.msg).toBe('User deactivated successfully');
    // Verify user is deactivated (e.g., try to login or get info)
    await expect(axios.post(`${USERS_API_BASE_URL}/login`, { email: userEmail, password: 'password123' })).rejects.toThrow();
  });

  it('should reactivate user account', async () => {
    const response = await axios.patch(`${USERS_API_BASE_URL}/reactivate`, {}, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.data.msg).toBe('User reactivated successfully');
    // Verify user is reactivated (e.g., try to login or get info)
    const loginResponse = await axios.post(`${USERS_API_BASE_URL}/login`, { email: userEmail, password: 'password123' });
    expect(loginResponse.status).toBe(200);
  });

  // Note: Testing forgot-password and reset-password requires mocking email sending or a more complex setup.
  // For now, these tests are omitted.

  // The delete user test should be the last one as it removes the user
  it('should delete user account', async () => {
    const response = await axios.delete(`${USERS_API_BASE_URL}/delete`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.data.msg).toBe('User deleted successfully');
    // Verify user is deleted (e.g., try to login or get info)
    await expect(axios.post(`${USERS_API_BASE_URL}/login`, { email: userEmail, password: 'password123' })).rejects.toThrow();
  });
});
