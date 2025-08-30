"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentAdminSelection = exports.reportAdminSelection = exports.matchRequestAdminSelection = exports.matchAdminSelection = exports.userAdminSelection = exports.getRefundsQuerySchema = exports.createRefundSchema = exports.getPaymentsQuerySchema = exports.getPaymentAnalyticsSchema = exports.createUserReportSchema = exports.updateReportSchema = exports.getReportsQuerySchema = exports.updateGameSchema = exports.createGameSchema = exports.createAdminMatchSchema = exports.updateMatchSchema = exports.getMatchRequestsQuerySchema = exports.getMatchesQuerySchema = exports.updateUserStatusSchema = exports.updateUserSchema = exports.getUserByIdSchema = exports.getUsersQuerySchema = exports.declineMatchRequestSchema = exports.editMatchRequestSchema = exports.approveMatchRequestSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.approveMatchRequestSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    gameId: zod_1.z.string().optional(),
    scheduledAt: zod_1.z.string().datetime().optional(),
    maxPlayers: zod_1.z.number().int().optional(),
    pricePerUser: zod_1.z.number().optional(),
    durationMins: zod_1.z.number().int().optional(),
});
exports.editMatchRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    gameId: zod_1.z.string().optional(),
    scheduledAt: zod_1.z.string().datetime().optional(),
    maxPlayers: zod_1.z.number().int().optional(),
    pricePerUser: zod_1.z.number().optional(),
    durationMins: zod_1.z.number().int().optional(),
    // status: z
    //   .enum(["PENDING", "APPROVED", "DECLINED", "EDITED_AND_APPROVED"])
    //   .optional(),
});
exports.declineMatchRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
});
// Define enums manually until Prisma regenerates
const PaymentStatus = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
    PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
};
const UserReportReason = {
    INAPPROPRIATE_BEHAVIOR: "INAPPROPRIATE_BEHAVIOR",
    HARASSMENT: "HARASSMENT",
    CHEATING: "CHEATING",
    NO_SHOW: "NO_SHOW",
    FAKE_PROFILE: "FAKE_PROFILE",
    SPAM: "SPAM",
    OTHER: "OTHER",
};
const ReportStatus = {
    PENDING: "PENDING",
    UNDER_REVIEW: "UNDER_REVIEW",
    RESOLVED: "RESOLVED",
    DISMISSED: "DISMISSED",
};
// User Management Schemas
exports.getUsersQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
    search: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
    role: zod_1.z.nativeEnum(client_1.Role).optional(),
    sortBy: zod_1.z.enum(["createdAt", "name", "email", "gamesPlayed"]).optional(),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
});
exports.getUserByIdSchema = zod_1.z.object({
    id: zod_1.z.string(),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
    role: zod_1.z.nativeEnum(client_1.Role).optional(),
    phoneNumber: zod_1.z.string().optional(),
    password: zod_1.z.string().optional(),
    birthdate: zod_1.z.string().optional(),
    gender: zod_1.z.string().optional(),
    age: zod_1.z.number().optional(),
    quoteType: zod_1.z.string().optional(),
    quoteAnswer: zod_1.z.string().optional(),
    skillLevel: zod_1.z.string().optional(),
    gamesPlayed: zod_1.z.number().optional(),
    isVerified: zod_1.z.boolean().optional(),
    bySocial: zod_1.z.boolean().optional(),
    lastLoginDate: zod_1.z.string().optional(),
    deactivated: zod_1.z.boolean().optional(),
    expoPushToken: zod_1.z.string().optional(),
    profileImage: zod_1.z.any().optional(),
    preferredTimes: zod_1.z.any().optional(),
    locations: zod_1.z.any().optional(),
    games: zod_1.z.any().optional(),
    createdMatches: zod_1.z.any().optional(),
    joinedMatches: zod_1.z.any().optional(),
    matchResults: zod_1.z.any().optional(),
    reportedNoShows: zod_1.z.any().optional(),
    reportedByNoShows: zod_1.z.any().optional(),
    givenRatings: zod_1.z.any().optional(),
    receivedRatings: zod_1.z.any().optional(),
    refreshTokens: zod_1.z.any().optional(),
    logs: zod_1.z.any().optional(),
    forgotPassword: zod_1.z.any().optional(),
    notifications: zod_1.z.any().optional(),
    achievements: zod_1.z.any().optional(),
    chatMessages: zod_1.z.any().optional(),
    payments: zod_1.z.any().optional(),
    reportsMade: zod_1.z.any().optional(),
    reportsReceived: zod_1.z.any().optional(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
exports.updateUserStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.UserStatus),
});
// Match Management Schemas
exports.getMatchesQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
    status: zod_1.z.string().optional(),
    gameId: zod_1.z.string().optional(),
    creatorId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(["createdAt", "scheduledAt", "pricePerUser"]).optional(),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
});
exports.getMatchRequestsQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
    status: zod_1.z.string().optional(),
    gameId: zod_1.z.string().optional(),
    requestedById: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(["createdAt", "scheduledAt", "maxPlayers"]).optional(),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
});
exports.updateMatchSchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    cancellationReason: zod_1.z.string().optional(),
});
exports.createAdminMatchSchema = zod_1.z.object({
    gameId: zod_1.z.string(),
    location: zod_1.z.object({
        name: zod_1.z.string().optional(),
        longitude: zod_1.z.number(),
        latitude: zod_1.z.number(),
        city: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
    }),
    scheduledAt: zod_1.z.string().datetime(),
    maxPlayers: zod_1.z.number().int().positive(),
    pricePerUser: zod_1.z.number().positive(),
    durationMins: zod_1.z.number().int().positive().optional(),
});
// Game Management Schemas
exports.createGameSchema = zod_1.z.object({
    name: zod_1.z.string(),
    imageId: zod_1.z.string().optional(),
});
exports.updateGameSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    imageId: zod_1.z.string().optional(),
    image: zod_1.z
        .object({
        publicId: zod_1.z.string(),
        url: zod_1.z.string(),
        fileName: zod_1.z.string(),
    })
        .optional(),
});
// Report Management Schemas
exports.getReportsQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
    status: zod_1.z
        .enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"])
        .optional(),
    reason: zod_1.z
        .enum([
        "INAPPROPRIATE_BEHAVIOR",
        "HARASSMENT",
        "CHEATING",
        "NO_SHOW",
        "FAKE_PROFILE",
        "SPAM",
        "OTHER",
    ])
        .optional(),
    reporterId: zod_1.z.string().optional(),
    reportedId: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(["createdAt", "status"]).optional(),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
});
exports.updateReportSchema = zod_1.z.object({
    status: zod_1.z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
    adminNotes: zod_1.z.string().optional(),
});
exports.createUserReportSchema = zod_1.z.object({
    reportedId: zod_1.z.string(),
    reason: zod_1.z.enum([
        "INAPPROPRIATE_BEHAVIOR",
        "HARASSMENT",
        "CHEATING",
        "NO_SHOW",
        "FAKE_PROFILE",
        "SPAM",
        "OTHER",
    ]),
    description: zod_1.z.string().optional(),
});
// Payment Analytics Schemas
exports.getPaymentAnalyticsSchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    period: zod_1.z.enum(["day", "week", "month", "year"]).optional().default("month"),
});
exports.getPaymentsQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
    status: zod_1.z
        .enum([
        "PENDING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
    ])
        .optional(),
    userId: zod_1.z.string().optional(),
    matchId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(["createdAt", "amount"]).optional(),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
});
// Refund Schemas
exports.createRefundSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    reason: zod_1.z.string().min(1, "Refund reason is required"),
});
exports.getRefundsQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
    userId: zod_1.z.string().optional(),
    matchId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(["createdAt", "amount"]).optional().default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
});
// Selection objects for consistent data return
exports.userAdminSelection = {
    id: true,
    name: true,
    email: true,
    phoneNumber: true,
    status: true,
    role: true,
    gamesPlayed: true,
    deactivated: true,
    lastLoginDate: true,
    createdAt: true,
    updatedAt: true,
    profileImage: {
        select: {
            id: true,
            url: true,
        },
    },
    _count: {
        select: {
            createdMatches: true,
            joinedMatches: true,
            reportsMade: true,
            reportsReceived: true,
        },
    },
};
exports.matchAdminSelection = {
    id: true,
    status: true,
    scheduledAt: true,
    maxPlayers: true,
    pricePerUser: true,
    durationMins: true,
    cancellationReason: true,
    createdAt: true,
    updatedAt: true,
    game: {
        select: {
            id: true,
            name: true,
        },
    },
    createdBy: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    location: {
        select: {
            id: true,
            name: true,
            city: true,
            country: true,
        },
    },
    _count: {
        select: {
            participants: true,
        },
    },
};
exports.matchRequestAdminSelection = {
    id: true,
    status: true,
    scheduledAt: true,
    maxPlayers: true,
    pricePerUser: true,
    durationMins: true,
    adminNote: true,
    createdAt: true,
    updatedAt: true,
    game: {
        select: {
            id: true,
            name: true,
        },
    },
    requestedBy: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    location: {
        select: {
            id: true,
            name: true,
            city: true,
            country: true,
        },
    },
    approvedBy: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
};
exports.reportAdminSelection = {
    id: true,
    reason: true,
    description: true,
    status: true,
    adminNotes: true,
    resolvedBy: true,
    resolvedAt: true,
    createdAt: true,
    updatedAt: true,
    reporter: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    reported: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
};
exports.paymentAdminSelection = {
    id: true,
    stripePaymentId: true,
    amount: true,
    currency: true,
    status: true,
    refundAmount: true,
    refundReason: true,
    refundedAt: true,
    paymentMethod: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    match: {
        select: {
            id: true,
            scheduledAt: true,
            game: {
                select: {
                    name: true,
                },
            },
        },
    },
};
