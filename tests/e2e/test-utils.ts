import axios from "axios";

const API_BASE_URL = "http://localhost:4000";
const USERS_API_BASE_URL = `${API_BASE_URL}/users`;
const GAMES_API_BASE_URL = `${API_BASE_URL}/games`;

export const generateUserData = () => {
  const timestamp = Date.now();
  const age = Math.floor(Math.random() * 40) + 18; // Random age between 18 and 57
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1; // Max 28 to avoid issues with months
  const birthdate = `${birthYear}-${birthMonth
    .toString()
    .padStart(2, "0")}-${birthDay.toString().padStart(2, "0")}`;

  return {
    name: `Test User ${timestamp}`,
    // username: `testuser_${timestamp}`, // Keeping this as it was in previous versions, though optional in schema
    email: `test_${timestamp}@example.com`,
    password: "password123",
    phoneNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`, // Generate a dummy phone number
    age: age,
    gender: Math.random() < 0.5 ? "MALE" : "FEMALE", // Random gender
    birthdate: birthdate,
    // Add other optional fields if they are commonly used or expected
    // skillLevel: 'BEGINNER',
    // quoteType: 'SPORTS_MANTRA',
    // quoteAnswer: 'Go hard or go home!',
  };
};

export const registerAndLoginUser = async () => {
  const userData = generateUserData();
  try {
    // Register user
    const registerResponse = await axios.post(
      `${USERS_API_BASE_URL}`,
      userData
    );
    console.log("Register Response Data:", registerResponse.data);
    const registeredUser = registerResponse.data;

    // Login user
    const loginResponse = await axios.post(`${USERS_API_BASE_URL}/login`, {
      email: userData.email,
      password: userData.password,
    });
    console.log("Login Response Data:", loginResponse.data);
    // Assuming accessToken is nested within the user object in the login response
    const accessToken = loginResponse.data.accessToken; // ✅ correct
    return { user: registeredUser, token: accessToken };
  } catch (error: any) {
    console.error(
      "Error during user registration and login:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const createGame = async () => {
  const gameData = {
    name: `Test Game ${Date.now()}`,
    description: "A game for testing purposes",
  };
  try {
    const response = await axios.post(GAMES_API_BASE_URL, gameData);
    return response.data.game.id;
  } catch (error: any) {
    console.error(
      "Error creating game:",
      error.response?.data || error.message
    );
    throw error;
  }
};
