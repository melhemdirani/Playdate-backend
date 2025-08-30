import { z } from "zod";
import { notificationsData } from "./data";

const notificationKeys = Object.keys(notificationsData) as [
  keyof typeof notificationsData,
  ...(keyof typeof notificationsData)[]
];

export const createNotificationSchema = z.object({
  type: z.enum(notificationKeys),
  redirectLink: z.string().url().optional(),
  userId: z.string(),
  data: z.any().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
});

export const updateNotificationSchema = z.object({
  seen: z.boolean().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
