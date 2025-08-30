import { Request, Response } from "express";
import { getUserChats, getChatMessages } from "./chatService";

export async function getUserChatsController(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const chats = await getUserChats(userId);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
}

export async function getChatMessagesController(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const chatId = req.params.chatId;
    const messages = await getChatMessages(userId, chatId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}
