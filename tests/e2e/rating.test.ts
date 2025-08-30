import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { registerAndLoginUser } from './test-utils';

const API_BASE_URL = 'http://localhost:4000';
const RATING_API_BASE_URL = `${API_BASE_URL}/ratings`;

describe.skip('Rating Endpoints', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeAll(async () => {
    // Ensure the server is running
    try {
      await axios.get(API_BASE_URL);
    } catch (error) {
      console.error('API is not reachable. Please ensure your server is running on port 4000.');
      process.exit(1);
    }

    // Register and login two users for testing
    const { user: user1, token: token1 } = await registerAndLoginUser();
    user1Token = token1;
    user1Id = user1.id;

    const { user: user2, token: token2 } = await registerAndLoginUser();
    user2Token = token2;
    user2Id = user2.id;
  });

  it('should create a new rating', async () => {
    const ratingData = {
      ratedUserId: user2Id, // User2 is being rated by User1
      rating: 4, // Example rating
      comment: 'Great player!',
      // Add other required fields for rating creation based on ratingSchema.ts
    };

    const response = await axios.post(RATING_API_BASE_URL, ratingData, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    expect(response.status).toBe(201); // Assuming 201 Created status
    expect(response.data).toBeDefined();
    expect(response.data.rating).toBeDefined();
    expect(response.data.rating.ratedUserId).toBe(ratingData.ratedUserId);
    expect(response.data.rating.rating).toBe(ratingData.rating);
  });

  it('should get ratings for a user', async () => {
    const response = await axios.get(`${RATING_API_BASE_URL}/user/${user2Id}`);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.ratings)).toBe(true);
    expect(response.data.ratings.length).toBeGreaterThan(0);
  });

  it('should calculate overall rating for a user', async () => {
    const response = await axios.get(`${RATING_API_BASE_URL}/user/${user2Id}/overall`);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.overallRating).toBeDefined();
    expect(typeof response.data.overallRating).toBe('number');
  });
});
