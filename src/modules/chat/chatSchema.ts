import { z } from "zod";

import { imageInputSchema } from "../variants/image/imageSchema";

export const createChatMessageSchema = z.object({
  matchId: z.string(),
  userId: z.string(),
  message: z.string().min(1).optional(),
  image: imageInputSchema.optional(),
});

export const chatMessageResponseSchema = z.object({
  id: z.string(),
  matchId: z.string(),
  userId: z.string(),
  message: z.string().optional(),
  image: imageInputSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    profileImage: z
      .object({
        url: z.string(),
      })
      .nullable(),
  }),
});

export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>;
export type ChatMessageResponse = z.infer<typeof chatMessageResponseSchema>;
