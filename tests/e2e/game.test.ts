import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { registerAndLoginUser } from './test-utils';

const API_BASE_URL = 'http://localhost:4000';
const GAME_API_BASE_URL = `${API_BASE_URL}/games`;

describe.skip('Game Endpoints', () => {
  let adminToken: string; // Assuming admin user might be needed for game creation
  let createdGameId: string;

  beforeAll(async () => {
    // Ensure the server is running
    try {
      await axios.get(API_BASE_URL);
    } catch (error) {
      console.error('API is not reachable. Please ensure your server is running on port 4000.');
      process.exit(1);
    }

    // Register and login an admin user if needed for game creation
    // For now, assuming game creation does not require auth based on commented out middleware
    // const { token } = await registerAndLoginUser(); // You might need a dedicated admin registration/login
    // adminToken = token;
  });

  it('should create a new game', async () => {
    const gameData = {
      name: `Test Game ${Date.now()}`,
      description: 'A game for testing purposes',
      // Add other required fields for game creation based on gameSchema.ts
    };

    const response = await axios.post(GAME_API_BASE_URL, gameData, {
      // headers: { Authorization: `Bearer ${adminToken}` }, // Uncomment if auth is required
    });

    expect(response.status).toBe(201); // Assuming 201 Created status
    expect(response.data).toBeDefined();
    expect(response.data.game).toBeDefined();
    expect(response.data.game.name).toBe(gameData.name);
    createdGameId = response.data.game.id;
  });

  it('should get all games', async () => {
    const response = await axios.get(GAME_API_BASE_URL);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.games)).toBe(true);
    expect(response.data.games.length).toBeGreaterThan(0);
  });

  it('should get a game by ID', async () => {
    const response = await axios.get(`${GAME_API_BASE_URL}/${createdGameId}`);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.game).toBeDefined();
    expect(response.data.game.id).toBe(createdGameId);
  });

  // Add more game tests here:
  // - Update game
  // - Delete game (requires admin auth)
});
