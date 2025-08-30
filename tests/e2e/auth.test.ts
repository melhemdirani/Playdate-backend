import { describe, it, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";
import { generateUserData, registerAndLoginUser } from "./test-utils";

const API_BASE_URL = "http://localhost:4000";
const USERS_API_BASE_URL = `${API_BASE_URL}/users`;

describe("Authentication Endpoints", () => {
  let user1: any;
  let user1Token: string;

  beforeAll(async () => {
    // Ensure the server is running before tests
    try {
      // Check a general endpoint to confirm server is up
      await axios.get(API_BASE_URL);
    } catch (error) {
      console.error(
        "API is not reachable. Please ensure your server is running on port 4000."
      );
      process.exit(1);
    }
  });

  it("should register a new user and then log in", async () => {
    const { user, token } = await registerAndLoginUser();
    user1 = user;
    user1Token = token;

    expect(user1).toBeDefined();
    expect(user1.email).toBeDefined();
    expect(user1Token).toBeDefined(); // Assert that the token is defined

    expect(user1.name).toBeDefined();
    expect(user1.phoneNumber).toBeDefined();
    expect(user1.id).toBeDefined();
    expect(user1.otp).toBeDefined();
    expect(user1.gender).toBeDefined();
    expect(user1.accessToken).toBeDefined();
    expect(user1.refreshToken).toBeDefined();
  });
});
