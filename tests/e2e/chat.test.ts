import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { registerAndLoginUser } from './test-utils';

const API_BASE_URL = 'http://localhost:4000';
const CHAT_SERVER_URL = 'http://localhost:4000'; // Your Socket.IO server URL

describe.skip('Chat Endpoints (Socket.IO)', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let socket1: Socket;
  let socket2: Socket;
  const dummyMatchId = 'test-match-123'; // In a real scenario, create a match via API

  beforeAll(async () => {
    // Ensure the server is running
    try {
      await axios.get(API_BASE_URL);
    } catch (error) {
      console.error('API is not reachable. Please ensure your server is running on port 4000.');
      process.exit(1);
    }

    // Register and login two users
    const { user: user1, token: token1 } = await registerAndLoginUser();
    user1Token = token1;
    user1Id = user1.id;

    const { user: user2, token: token2 } = await registerAndLoginUser();
    user2Token = token2;
    user2Id = user2.id;

    // Connect sockets for both users
    socket1 = io(CHAT_SERVER_URL, { auth: { token: user1Token } });
    socket2 = io(CHAT_SERVER_URL, { auth: { token: user2Token } });

    // Wait for sockets to connect
    await new Promise<void>((resolve) => {
      socket1.on('connect', () => {
        console.log('Socket 1 connected');
        resolve();
      });
    });
    await new Promise<void>((resolve) => {
      socket2.on('connect', () => {
        console.log('Socket 2 connected');
        resolve();
      });
    });
  });

  afterAll(() => {
    socket1.disconnect();
    socket2.disconnect();
  });

  it('should allow users to join a match chat', async () => {
    socket1.emit('joinMatchChat', dummyMatchId);
    socket2.emit('joinMatchChat', dummyMatchId);

    // Give some time for the server to process join requests
    await new Promise((resolve) => setTimeout(resolve, 100));

    // No direct assertion here, as joinMatchChat doesn't return a direct response
    // We'll verify by sending/receiving messages.
  });

  it('should allow users to send and receive messages', async () => {
    const messageContent = 'Hello from user 1!';
    const receivedMessagePromise = new Promise((resolve) => {
      socket2.on('newMessage', (message) => {
        expect(message.content).toBe(messageContent);
        expect(message.senderId).toBe(user1Id);
        expect(message.matchId).toBe(dummyMatchId);
        resolve(null);
      });
    });

    socket1.emit('sendMessage', {
      matchId: dummyMatchId,
      senderId: user1Id,
      content: messageContent,
    });

    await receivedMessagePromise;
  });

  it('should receive chat history when joining', async () => {
    const newSocket = io(CHAT_SERVER_URL, { auth: { token: user1Token } });
    await new Promise<void>((resolve) => newSocket.on('connect', resolve));

    const chatHistoryPromise = new Promise((resolve) => {
      newSocket.on('chatHistory', (messages) => {
        expect(Array.isArray(messages)).toBe(true);
        expect(messages.length).toBeGreaterThan(0); // Assuming at least one message from previous test
        resolve(null);
      });
    });

    newSocket.emit('joinMatchChat', dummyMatchId);
    await chatHistoryPromise;
    newSocket.disconnect();
  });
});
