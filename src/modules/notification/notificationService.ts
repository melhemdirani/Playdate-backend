import { PrismaClient } from "@prisma/client";
import {
  CreateNotificationInput,
  UpdateNotificationInput,
} from "./notificationSchema";
import { notificationsData, getNotificationData } from "./data";
import { sendEmail } from "../../utils/nodemailer";

const prisma = new PrismaClient();

import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export const createNotification = async (data: CreateNotificationInput) => {
  console.log(
    "[createNotification] Attempting to create notification with data:",
    data
  );
  try {
    // Extract props from data for dynamic notifications
    const notificationProps = data.data
      ? {
          gameType: data.data.game?.name,
          playerName: data.data.player?.name,
          matchDate: data.data.match?.scheduledAt
            ? new Date(data.data.match.scheduledAt).toLocaleDateString()
            : undefined,
          achievementName: data.data.achievement?.name,
          milestoneType: data.data.milestone?.type,
          ...data.data, // Include any other custom props
        }
      : undefined;

    // Get dynamic notification data
    const dynamicNotification = getNotificationData(
      data.type,
      notificationProps
    );

    const notificationData: any = {
      title: data.title ?? dynamicNotification.title,
      subtitle: data.subtitle ?? dynamicNotification.content,
      type: dynamicNotification.type,
      userId: data.userId,
      redirectLink: data.redirectLink,
      urgency: dynamicNotification.urgency,
      category: dynamicNotification.category,
    };
    if (typeof data.data !== "undefined") {
      // If data contains a game, ensure its image is included
      if (data.data.game && !data.data.game.image && data.data.game.imageId) {
        // If only imageId is present, fetch the image from DB
        const gameImage = await prisma.image.findUnique({
          where: { id: data.data.game.imageId },
          select: {
            url: true,
            publicId: true,
            fileName: true,
          },
        });
        notificationData.data = {
          ...data.data,
          game: {
            ...data.data.game,
            image: gameImage || null,
          },
        };
      } else {
        notificationData.data = data.data;
      }
    }
    const notification = await prisma.notification.create({
      data: notificationData,
    });

    // Fetch the user's Expo push token
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { expoPushToken: true },
    });

    if (
      user &&
      user.expoPushToken &&
      Expo.isExpoPushToken(user.expoPushToken)
    ) {
      const messages: ExpoPushMessage[] = [];
      messages.push({
        to: user.expoPushToken,
        sound: "default",
        title: data.title ?? dynamicNotification.title,
        body: (data.subtitle ?? dynamicNotification.content) || "",
        priority: dynamicNotification.urgency === "URGENT" ? "high" : "default",
        data: {
          redirectLink: data.redirectLink,
          notificationId: notification.id,
          data: data.data ?? null,
        },
      });

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error("Error sending push notification chunk:", error);
        }
      }
      console.log("Push notification tickets:", tickets);
    } else {
      console.log(
        `Not sending push notification: User ${data.userId} has no valid Expo push token.`
      );
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification.");
  }
};

// Send email notification for specific types
async function sendEmailNotificationIfNeeded(
  data: CreateNotificationInput,
  notification: any
) {
  // Only send emails if email service is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email service not configured, skipping email notification");
    return;
  }

  if (data.type === "player_rated_you") {
    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { name: true, email: true },
    });

    if (user && user.email) {
      // Fetch rater details if available
      let raterName = "A player";
      if (data.data?.raterId) {
        const rater = await prisma.user.findUnique({
          where: { id: data.data.raterId },
          select: { name: true },
        });
        if (rater) {
          raterName = rater.name;
        }
      }

      await sendEmail({
        to: user.email,
        subject: "You received a new rating - Play Date",
        text: `Hi ${user.name}, ${raterName} has rated you after a recent match. Check the app to see your feedback!`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4CAF50;">You've been rated!</h2>
            <p>Hi ${user.name},</p>
            <p><strong>${raterName}</strong> has rated you after a recent match.</p>
            <p>Check your Play Date app to see your feedback and overall rating.</p>
            <p>Keep up the great work!</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-left: 4px solid #4CAF50;">
              <p><strong>💡 Tip:</strong> Receiving ratings helps improve your profile and makes it easier to find matches with other players!</p>
            </div>
          </div>
        `,
      });

      console.log(
        `Email sent to ${user.email} for player_rated_you notification`
      );
    }
  }
}

export const getNotificationsByUserId = async (userId: string) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to retrieve notifications.");
  }
};

export const markNotificationAsSeen = async (notificationId: string) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { seen: true },
    });
    return notification;
  } catch (error) {
    console.error("Error marking notification as seen:", error);
    throw new Error("Failed to mark notification as seen.");
  }
};

export const deleteNotification = async (notificationId: string) => {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw new Error("Failed to delete notification.");
  }
};
