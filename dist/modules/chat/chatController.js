"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatMessagesController = exports.getUserChatsController = void 0;
const chatService_1 = require("./chatService");
async function getUserChatsController(req, res) {
    try {
        const userId = req.user.id;
        const chats = await (0, chatService_1.getUserChats)(userId);
        res.json(chats);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch chats" });
    }
}
exports.getUserChatsController = getUserChatsController;
async function getChatMessagesController(req, res) {
    try {
        const userId = req.user.id;
        const chatId = req.params.chatId;
        const messages = await (0, chatService_1.getChatMessages)(userId, chatId);
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
}
exports.getChatMessagesController = getChatMessagesController;
