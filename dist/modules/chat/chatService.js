"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatMessagesForMatch = exports.createChatMessage = exports.getChatMessages = exports.getUserChats = exports.getChatMessagesWithMatchAndTeams = void 0;
// Returns match details and messages with user team info for socket usage
async function getChatMessagesWithMatchAndTeams(userId, matchId) {
    try {
        // Get match with participants
        const match = await db_1.prisma.match.findUnique({
            where: { id: matchId },
            select: {
                ...matchSchema_1.matchSelection,
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
        const messages = await db_1.prisma.chatMessage.findMany({
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
        const userTeams = {};
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
    }
    catch (error) {
        console.error("[chatService:getChatMessagesWithMatchAndTeams] Error:", error);
        throw new Error("Could not fetch chat messages with match details");
    }
}
exports.getChatMessagesWithMatchAndTeams = getChatMessagesWithMatchAndTeams;
const db_1 = require("../../db/db");
const matchService_1 = require("../match/matchService");
const matchSchema_1 = require("../match/matchSchema");
async function getUserChats(userId) {
    try {
        const matches = await db_1.prisma.match.findMany({
            where: {
                participants: {
                    some: { userId: userId },
                },
            },
            select: {
                ...matchSchema_1.matchSelection,
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
    }
    catch (error) {
        console.error("[chatService:getUserChats] Error:", error);
        throw new Error("Could not fetch user chats");
    }
}
exports.getUserChats = getUserChats;
async function getChatMessages(userId, chatId) {
    try {
        const match = await db_1.prisma.match.findUnique({
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
            console.error(`[chatService:getChatMessages] User ${userId} not in chat ${chatId}`);
            throw new Error("User not in chat");
        }
        const userTeams = {};
        match.participants.forEach((p) => {
            userTeams[p.userId] =
                p.team !== null && p.team !== undefined ? String(p.team) : null;
        });
        const messages = await db_1.prisma.chatMessage.findMany({
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
    }
    catch (error) {
        console.error("[chatService:getChatMessages] Error:", error);
        throw new Error("Could not fetch chat messages");
    }
}
exports.getChatMessages = getChatMessages;
async function createChatMessage(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const chatMessage = await db_1.prisma.chatMessage.create({
        data: {
            matchId: input.matchId,
            userId: input.userId,
            message: (_a = input.message) !== null && _a !== void 0 ? _a : "",
            imageUrl: (_c = (_b = input.image) === null || _b === void 0 ? void 0 : _b.url) !== null && _c !== void 0 ? _c : "",
            imagePublicId: (_e = (_d = input.image) === null || _d === void 0 ? void 0 : _d.publicId) !== null && _e !== void 0 ? _e : undefined,
            imageFileName: (_g = (_f = input.image) === null || _f === void 0 ? void 0 : _f.fileName) !== null && _g !== void 0 ? _g : undefined,
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
    const totalMessages = await db_1.prisma.chatMessage.count({
        where: { userId: input.userId },
    });
    console.log(`[chatService] Attempting to award "Chatted for the First Time" to user ${input.userId}.`);
    await (0, matchService_1.awardAchievement)(input.userId, "Chatted for the First Time");
    console.log("[chatService:createChatMessage] Saved message:", chatMessage);
    return chatMessage;
}
exports.createChatMessage = createChatMessage;
async function getChatMessagesForMatch(matchId) {
    // Get participants for team info
    const match = await db_1.prisma.match.findUnique({
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
    const userTeams = {};
    match === null || match === void 0 ? void 0 : match.participants.forEach((p) => {
        userTeams[p.userId] =
            p.team !== null && p.team !== undefined ? String(p.team) : null;
    });
    const chatMessages = await db_1.prisma.chatMessage.findMany({
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
exports.getChatMessagesForMatch = getChatMessagesForMatch;
