import { Server, Socket } from "socket.io";
import { createChatMessage, getChatMessagesForMatch } from "./chatService";
import { CreateChatMessageInput } from "./chatSchema";

export function setupChatEvents(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinMatchChat", async (matchId: string) => {
      socket.join(matchId);
      console.log(`User ${socket.id} joined chat for match ${matchId}`);

      // Send historical messages to the newly joined user
      const messages = await getChatMessagesForMatch(matchId);
      socket.emit("chatHistory", messages);
    });

    socket.on("sendMessage", async (data: CreateChatMessageInput) => {
      try {
        const newMessage = await createChatMessage(data);
        io.to(data.matchId).emit("newMessage", newMessage);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("chatError", "Failed to send message.");
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
