import { z } from "zod";
import {
  imageInputSchema,
  imageSelection,
} from "../variants/image/imageSchema";

export const gameSchema = z.object({
  name: z.enum(["padel", "basketball", "tennis", "volleyball", "squash"]),
  image: imageInputSchema.optional(),
});
export const gameSelection = {
  id: true,
  name: true,
  image: imageSelection,
};
export type GameInput = z.infer<typeof gameSchema>;
