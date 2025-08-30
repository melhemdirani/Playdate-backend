import { z } from "zod";
import { LocationSchema } from "../match/matchSchema";

export const createMatchRequestSchema = z.object({
  gameId: z.string(),
  location: LocationSchema,
  scheduledAt: z.string().datetime(),
  maxPlayers: z.number().int().positive(),
  durationMins: z.number().int().positive().optional(),
});

export type CreateMatchRequestInput = z.infer<typeof createMatchRequestSchema>;
