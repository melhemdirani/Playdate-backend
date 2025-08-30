// Returns match details and messages with user team info for socket usage
export async function getChatMessagesWithMatchAndTeams(
  userId: string,
  matchId: string
) {
  try {
    // Get match with participants
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        ...matchSelection,
        participants: {
          select: {
            userId: true,
            team: true,
            user: {
              select: {
                id: true,
                name: true,
                profileImage: { select: { url: true } },
              },
            },
          },
        },
      },
    });

    if (!match || !match.participants.some((p) => p.userId === userId)) {
      throw new Error("User not in chat");
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: { select: { url: true } },
          },
        },
      },
    });

    // Map userId to team for quick lookup
    const userTeams: Record<string, string | null> = {};
    match.participants.forEach((p) => {
      userTeams[p.userId] =
        p.team !== null && p.team !== undefined ? String(p.team) : null;
    });

    // Attach team info to each message
    const messagesWithTeam = messages.map((msg) => ({
      ...msg,
      user: {
        ...msg.user,
        team: userTeams[msg.user.id] || null,
      },
    }));

    return {
      match: {
        id: match.id,
        game: match.game,
        location: match.location,
        scheduledAt: match.scheduledAt,
        maxPlayers: match.maxPlayers,
        pricePerUser: match.pricePerUser,
        durationMins: match.durationMins,
        status: match.status,
      },
      messages: messagesWithTeam,
    };
  } catch (error) {
    console.error(
      "[chatService:getChatMessagesWithMatchAndTeams] Error:",
      error
    );
    throw new Error("Could not fetch chat messages with match details");
  }
}
import { prisma } from "../../db/db";
import { CreateChatMessageInput } from "./chatSchema";
import { awardAchievement } from "../match/matchService";

import { matchSelection } from "../match/matchSchema";

export async function getUserChats(userId: string) {
  try {
    const matches = await prisma.match.findMany({
      where: {
        participants: {
          some: { userId: userId },
        },
      },
      select: {
        ...matchSelection,
        chatMessages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { user: true },
        },
      },
    });
    return matches.map((match) => ({
      chatId: match.id,
      participants: match.participants.map((p) => ({
        userId: p.userId,
        joinedAt: p.joinedAt,
        team: p.team,
        ...p.user,
      })),
      matchData: {
        id: match.id,
        game: match.game,
        location: match.location,
        scheduledAt: match.scheduledAt,
        maxPlayers: match.maxPlayers,
        pricePerUser: match.pricePerUser,
        durationMins: match.durationMins,
        status: match.status,
      },
      creator: match.createdBy,
      lastMessage: match.chatMessages[0] || null,
    }));
  } catch (error) {
    console.error("[chatService:getUserChats] Error:", error);
    throw new Error("Could not fetch user chats");
  }
}

export async function getChatMessages(userId: string, chatId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: chatId },
      select: {
        participants: {
          select: {
            userId: true,
            team: true,
          },
        },
      },
    });
    if (!match || !match.participants.some((p) => p.userId === userId)) {
      console.error(
        `[chatService:getChatMessages] User ${userId} not in chat ${chatId}`
      );
      throw new Error("User not in chat");
    }
    const userTeams: Record<string, string | null> = {};
    match.participants.forEach((p) => {
      userTeams[p.userId] =
        p.team !== null && p.team !== undefined ? String(p.team) : null;
    });
    const messages = await prisma.chatMessage.findMany({
      where: { matchId: chatId },
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });
    return messages.map((msg) => ({
      ...msg,
      user: {
        ...msg.user,
        team: userTeams[msg.user.id] || null,
      },
    }));
  } catch (error) {
    console.error("[chatService:getChatMessages] Error:", error);
    throw new Error("Could not fetch chat messages");
  }
}

export async function createChatMessage(input: CreateChatMessageInput) {
  const chatMessage = await prisma.chatMessage.create({
    data: {
      matchId: input.matchId,
      userId: input.userId,
      message: input.message ?? "",
      imageUrl: input.image?.url ?? "",
      imagePublicId: input.image?.publicId ?? undefined,
      imageFileName: input.image?.fileName ?? undefined,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: {
            select: {
              url: true,
            },
          },
        },
      },
    },
  });

  // Check for "Chatted for the First Time" achievement
  const totalMessages = await prisma.chatMessage.count({
    where: { userId: input.userId },
  });

  console.log(
    `[chatService] Attempting to award "Chatted for the First Time" to user ${input.userId}.`
  );
  await awardAchievement(input.userId, "Chatted for the First Time");

  console.log("[chatService:createChatMessage] Saved message:", chatMessage);
  return chatMessage;
}

export async function getChatMessagesForMatch(matchId: string) {
  // Get participants for team info
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      participants: {
        select: {
          userId: true,
          team: true,
        },
      },
    },
  });
  const userTeams: Record<string, string | null> = {};
  match?.participants.forEach((p) => {
    userTeams[p.userId] =
      p.team !== null && p.team !== undefined ? String(p.team) : null;
  });
  const chatMessages = await prisma.chatMessage.findMany({
    where: {
      matchId,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: {
            select: {
              url: true,
            },
          },
        },
      },
    },
  });
  return chatMessages.map((msg) => ({
    ...msg,
    user: {
      ...msg.user,
      team: userTeams[msg.user.id] || null,
    },
  }));
}
