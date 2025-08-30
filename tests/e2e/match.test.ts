import { describe, it, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";
import { registerAndLoginUser, createGame } from "./test-utils";

const API_BASE_URL = "http://localhost:4000";
const MATCH_API_BASE_URL = `${API_BASE_URL}/matches`;

describe("Match Endpoints", () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let createdMatchId: string;
  let gameId: string;

  beforeAll(async () => {
    // Ensure the server is running
    try {
      await axios.get(API_BASE_URL);
    } catch (error) {
      console.error(
        "API is not reachable. Please ensure your server is running on port 4000."
      );
      process.exit(1);
    }

    // Register and login two users for testing
    const { user: user1, token: token1 } = await registerAndLoginUser();
    user1Token = token1;
    user1Id = user1.id; // Assuming user object returned contains id

    const { user: user2, token: token2 } = await registerAndLoginUser();
    user2Token = token2;
    user2Id = user2.id; // Assuming user object returned contains id

    // Create a game to use in match creation
    gameId = await createGame();
  });

  it("should create a new match", async () => {
    const matchData = {
      gameId: gameId,
      location: "Some Location",
      date: new Date().toISOString(),
      time: "18:00",
      maxPlayers: 4,
      description: "A test match",
    };

    const response = await axios.post(MATCH_API_BASE_URL, matchData, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    expect(response.status).toBe(201); // Assuming 201 Created status
    expect(response.data).toBeDefined();
    expect(response.data.match).toBeDefined();
    expect(response.data.match.gameId).toBe(matchData.gameId);
    createdMatchId = response.data.match.id;
  });

  // Add more match tests here:
  // - Get all matches
  // - Get match by ID
  // - Join match
  // - Update match
  // - Delete match
  // - Report match result
  // - Update match outcome
  // - Report no-show
  // - Submit no-show reason
  // - Reschedule match
  // - Cancel match
  // - Leave match
  // - Get recommended matches
});
