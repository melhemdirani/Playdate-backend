"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("./chatController");
const middleware_1 = require("../../middleware");
const router = (0, express_1.Router)();
router.get("/", middleware_1.auth, chatController_1.getUserChatsController);
router.get("/:chatId/messages", middleware_1.auth, chatController_1.getChatMessagesController);
exports.default = router;
