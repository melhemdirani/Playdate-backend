"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChatEvents = void 0;
const chatService_1 = require("./chatService");
function setupChatEvents(io) {
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);
        socket.on("joinMatchChat", async (matchId) => {
            socket.join(matchId);
            console.log(`User ${socket.id} joined chat for match ${matchId}`);
            // Send historical messages to the newly joined user
            const messages = await (0, chatService_1.getChatMessagesForMatch)(matchId);
            socket.emit("chatHistory", messages);
        });
        socket.on("sendMessage", async (data) => {
            try {
                const newMessage = await (0, chatService_1.createChatMessage)(data);
                io.to(data.matchId).emit("newMessage", newMessage);
            }
            catch (error) {
                console.error("Error sending message:", error);
                socket.emit("chatError", "Failed to send message.");
            }
        });
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
}
exports.setupChatEvents = setupChatEvents;
