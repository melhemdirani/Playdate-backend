import { Router } from "express";
import {
  getUserChatsController,
  getChatMessagesController,
} from "./chatController";
import { auth } from "../../middleware";

const router = Router();

router.get("/", auth, getUserChatsController);
router.get("/:chatId/messages", auth, getChatMessagesController);

export default router;
