"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchSelection = exports.matchParticipantSelection = exports.matchParticipantUserSelection = exports.leaveMatchSchema = exports.cancelMatchSchema = exports.rescheduleMatchSchema = exports.submitNoShowReasonSchema = exports.reportNoShowSchema = exports.submitPlayerRatingsSchema = exports.updateMatchOutcomeSchema = exports.reportMatchResultSchema = exports.getRecommendedMatchesQuerySchema = exports.getMatchesQuerySchema = exports.updateMatchSchema = exports.createMatchSchema = exports.LocationSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const usersSchema_1 = require("../user/usersSchema");
const client_2 = require("@prisma/client");
exports.LocationSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    longitude: zod_1.z.number(),
    latitude: zod_1.z.number(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
});
exports.createMatchSchema = zod_1.z.object({
    gameId: zod_1.z.string(),
    location: exports.LocationSchema,
    scheduledAt: zod_1.z.string().datetime(),
    maxPlayers: zod_1.z.number().int().positive(),
    pricePerUser: zod_1.z.number().positive(),
    durationMins: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.nativeEnum(client_2.MatchStatus).optional(),
});
exports.updateMatchSchema = zod_1.z.object({
    location: exports.LocationSchema.optional(),
    scheduledAt: zod_1.z.string().datetime().optional(),
    maxPlayers: zod_1.z.number().int().positive().optional(),
    pricePerUser: zod_1.z.number().positive().optional(),
    durationMins: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.nativeEnum(client_2.MatchStatus).optional(),
});
exports.getMatchesQuerySchema = zod_1.z.object({
    gameId: zod_1.z.string().optional(),
    locationId: zod_1.z.string().optional(),
    // status: z.nativeEnum(MatchStatus).optional(),
    status: zod_1.z.string().optional(),
    creatorId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(), // For excluding matches the user is in
    // Add other query parameters as needed
});
exports.getRecommendedMatchesQuerySchema = zod_1.z.object({
    date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Date must be in YYYY-MM-DD format",
    })
        .optional(),
    time: zod_1.z.enum(["MORNING", "AFTERNOON", "LATE_NIGHT"]).optional(),
    sortBy: zod_1.z.enum(["scheduledAt", "pricePerUser"]).optional(),
    gender: zod_1.z.enum(["MALE", "FEMALE", "ANYONE"]).optional(),
    sports: zod_1.z.string().optional(),
    gameId: zod_1.z.string().optional(),
    longitude: zod_1.z.coerce.number().optional(),
    latitude: zod_1.z.coerce.number().optional(),
});
exports.reportMatchResultSchema = zod_1.z.object({
    outcome: zod_1.z.nativeEnum(client_2.MatchOutcome),
    ratings: zod_1.z
        .record(zod_1.z.string(), zod_1.z.object({
        rating: zod_1.z.number().min(1).max(5),
        comment: zod_1.z.string().optional(),
    }))
        .optional(),
});
exports.updateMatchOutcomeSchema = zod_1.z.object({
    outcome: zod_1.z.nativeEnum(client_2.MatchOutcome),
});
exports.submitPlayerRatingsSchema = zod_1.z.object({
    ratings: zod_1.z.record(zod_1.z.string(), zod_1.z.object({
        rating: zod_1.z.number().min(1).max(5),
        comment: zod_1.z.string().optional(),
    })),
});
exports.reportNoShowSchema = zod_1.z.object({
    reportedUserIds: zod_1.z.array(zod_1.z.string()),
    reason: zod_1.z.string().optional(),
});
exports.submitNoShowReasonSchema = zod_1.z
    .object({
    reason: zod_1.z.nativeEnum(client_1.NoShowReasonType),
    customReason: zod_1.z.string().optional(),
})
    .refine((data) => {
    if (data.reason === client_1.NoShowReasonType.OTHER && !data.customReason) {
        return false;
    }
    return true;
}, {
    message: "Custom reason is required when 'OTHER' is selected",
    path: ["customReason"],
});
exports.rescheduleMatchSchema = zod_1.z.object({
    newDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "newDate must be in YYYY-MM-DD format",
    }),
    newTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, { message: "newTime must be in HH:MM format" }),
});
exports.cancelMatchSchema = zod_1.z.object({
    cancellationReason: zod_1.z.string(),
    customCancellationReason: zod_1.z.string().optional(),
});
exports.leaveMatchSchema = zod_1.z.object({
    cancellationReason: zod_1.z.string(),
    customCancellationReason: zod_1.z.string().optional(),
});
// export type GetRecommendedMatchesQueryInput = z.infer<
//   typeof getRecommendedMatchesQuerySchema
// >;
exports.matchParticipantUserSelection = {
    id: true,
    name: true,
    profileImage: {
        select: {
            url: true,
        },
    },
    games: {
        select: {
            gameId: true,
            level: true,
        },
    },
};
exports.matchParticipantSelection = {
    userId: true,
    joinedAt: true,
    team: true,
    user: {
        select: exports.matchParticipantUserSelection,
    },
};
exports.matchSelection = {
    id: true,
    game: {
        select: {
            id: true,
            name: true,
            image: true,
        },
    },
    location: true,
    scheduledAt: true,
    maxPlayers: true,
    pricePerUser: true,
    durationMins: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    results: {
        select: {
            userId: true,
            outcome: true,
            reportedAt: true,
            user: {
                select: {
                    name: true,
                    profileImage: {
                        select: { url: true },
                    },
                    // Include all received ratings (you can compute average on frontend or backend)
                    receivedRatings: {
                        select: {
                            rating: true,
                            rater: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    createdBy: {
        select: {
            ...usersSchema_1.userMiniSelection,
            games: {
                select: {
                    level: true,
                    game: {
                        select: {
                            id: true,
                            name: true,
                            image: {
                                select: {
                                    id: true,
                                    publicId: true,
                                    url: true,
                                    fileName: true,
                                },
                            },
                        },
                    },
                    gameScore: {
                        select: {
                            startDate: true,
                            frequency: true,
                            userSelfRating: true,
                            level: true,
                        },
                    },
                },
            },
            quoteType: true,
            quoteAnswer: true,
            receivedRatings: {
                select: {
                    rating: true,
                    rater: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    },
    participants: {
        select: {
            ...exports.matchParticipantSelection,
            user: {
                select: {
                    ...exports.matchParticipantUserSelection,
                    games: {
                        select: {
                            level: true,
                            game: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: {
                                        select: {
                                            id: true,
                                            publicId: true,
                                            url: true,
                                            fileName: true,
                                        },
                                    },
                                },
                            },
                            gameScore: {
                                select: {
                                    startDate: true,
                                    frequency: true,
                                    userSelfRating: true,
                                    level: true,
                                },
                            },
                        },
                    },
                    receivedRatings: {
                        select: {
                            rating: true,
                            rater: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
