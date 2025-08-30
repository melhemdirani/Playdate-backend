"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRating = exports.getUserRatings = exports.isRatingAllowed = exports.calculateUserOverallRating = void 0;
const client_1 = require("@prisma/client");
const notificationService_1 = require("../notification/notificationService");
const prisma = new client_1.PrismaClient();
const calculateUserOverallRating = async (userId) => {
    const ratings = await prisma.rating.findMany({
        where: {
            ratedId: userId,
        },
        select: {
            rating: true,
        },
    });
    if (ratings.length === 0) {
        return 0;
    }
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    return totalRating / ratings.length;
};
exports.calculateUserOverallRating = calculateUserOverallRating;
// Check if rating is still allowed for a match (within 24 hours of completion)
const isRatingAllowed = async (matchId) => {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: {
            status: true,
            updatedAt: true,
        },
    });
    if (!match || match.status !== "COMPLETED") {
        return {
            allowed: false,
            reason: "Match is not completed yet",
        };
    }
    const completionTime = match.updatedAt;
    const ratingDeadline = new Date(completionTime.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    if (now > ratingDeadline) {
        return {
            allowed: false,
            reason: "Rating deadline has passed (24 hours after match completion)",
            hoursRemaining: 0,
        };
    }
    const timeRemaining = ratingDeadline.getTime() - now.getTime();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    return {
        allowed: true,
        reason: "Rating is still allowed",
        hoursRemaining,
        deadline: ratingDeadline,
    };
};
exports.isRatingAllowed = isRatingAllowed;
const getUserRatings = async (userId) => {
    return prisma.rating.findMany({
        where: {
            ratedId: userId,
        },
        include: {
            rater: {
                select: {
                    id: true,
                    name: true,
                    profileImage: true,
                },
            },
            match: {
                select: {
                    id: true,
                    game: {
                        select: {
                            name: true,
                        },
                    },
                    scheduledAt: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
exports.getUserRatings = getUserRatings;
const createRating = async (raterId, ratedId, matchId, rating) => {
    var _a;
    // Check if the match exists and is completed
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: {
            id: true,
            status: true,
            updatedAt: true,
            game: {
                select: {
                    name: true,
                },
            },
        },
    });
    if (!match) {
        throw new Error("Match not found");
    }
    if (match.status !== "COMPLETED") {
        throw new Error("Can only rate completed matches");
    }
    // Check if rating deadline has passed (24 hours after match completion)
    const completionTime = match.updatedAt;
    const ratingDeadline = new Date(completionTime.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    if (now > ratingDeadline) {
        throw new Error("Rating deadline has passed. You can only rate within 24 hours of match completion.");
    }
    // Check if user has already rated this match
    const existingRating = await prisma.rating.findFirst({
        where: {
            raterId,
            ratedId,
            matchId,
        },
    });
    if (existingRating) {
        throw new Error("You have already rated this user for this match");
    }
    const createdRating = await prisma.rating.create({
        data: {
            raterId,
            ratedId,
            matchId,
            rating,
        },
        include: {
            rater: {
                select: {
                    name: true,
                },
            },
            match: {
                select: {
                    game: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });
    // Send notification to rated player
    await (0, notificationService_1.createNotification)({
        userId: ratedId,
        type: "player_rated_you",
        data: {
            gameType: (_a = createdRating.match.game) === null || _a === void 0 ? void 0 : _a.name,
            playerName: createdRating.rater.name,
            rating: rating,
            matchId,
            raterId,
        },
        redirectLink: "/profile",
    });
    return createdRating;
};
exports.createRating = createRating;
