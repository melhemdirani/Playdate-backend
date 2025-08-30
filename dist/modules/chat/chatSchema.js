"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatMessageResponseSchema = exports.createChatMessageSchema = void 0;
const zod_1 = require("zod");
const imageSchema_1 = require("../variants/image/imageSchema");
exports.createChatMessageSchema = zod_1.z.object({
    matchId: zod_1.z.string(),
    userId: zod_1.z.string(),
    message: zod_1.z.string().min(1).optional(),
    image: imageSchema_1.imageInputSchema.optional(),
});
exports.chatMessageResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    matchId: zod_1.z.string(),
    userId: zod_1.z.string(),
    message: zod_1.z.string().optional(),
    image: imageSchema_1.imageInputSchema.optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    user: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        profileImage: zod_1.z
            .object({
            url: zod_1.z.string(),
        })
            .nullable(),
    }),
});
