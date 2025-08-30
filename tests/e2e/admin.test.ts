import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { registerAndLoginUser, generateUserData } from './test-utils';

const API_BASE_URL = 'http://localhost:4000';
const ADMIN_API_BASE_URL = `${API_BASE_URL}/admin`;
const USERS_API_BASE_URL = `${API_BASE_URL}/users`;

describe.skip('Admin Endpoints', () => {
  let adminToken: string;
  let adminEmail: string;

  beforeAll(async () => {
    // Ensure the server is running
    try {
      await axios.get(API_BASE_URL);
    } catch (error) {
      console.error('API is not reachable. Please ensure your server is running on port 4000.');
      process.exit(1);
    }

    // Register a user and then assign admin role to them
    const { user, token } = await registerAndLoginUser();
    adminToken = token;
    adminEmail = user.email;

    // Assign admin role to the user
    await axios.get(`${API_BASE_URL}/assign-admin-role/${adminEmail}`);
  });

  it('should get filtered users as admin', async () => {
    const response = await axios.get(`${ADMIN_API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.users)).toBe(true);
  });

  it('should register a new admin user', async () => {
    const newAdminData = generateUserData();
    const response = await axios.post(`${ADMIN_API_BASE_URL}/admins`, newAdminData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(response.status).toBe(201); // Assuming 201 Created status
    expect(response.data).toBeDefined();
    expect(response.data.msg).toBe('Admin registered successfully');
  });

  // Note: Testing user approval/rejection flows (accept/reject user signup, approve/disapprove user) 
  // is more complex as it requires setting up users in specific pending states. 
  // These tests are omitted for now.
});
