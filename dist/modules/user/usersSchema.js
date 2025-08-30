"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicUserSelection = exports.getUserByIdSchema = exports.userResponseBaseSchema = exports.checkEmailSchema = exports.checkPhoneSchema = exports.loginUserSchema = exports.userOtpSelection = exports.userSelectionForLogin = exports.userWithParticipatedMatchesSelection = exports.userSelection = exports.userInfoSelection = exports.imageSchema = exports.getFilteredUsersSchema = exports.updateUserSchema = exports.createUserSchema = exports.locationInputSchema = exports.userGameInputSchema = exports.userMiniSelection = exports.forgetPasswordSchema = exports.gameScoreSchema = exports.resetPasswordByTokenSchema = exports.QuoteTypeEnum = void 0;
const zod_1 = require("zod");
const imageSchema_1 = require("../variants/image/imageSchema");
exports.QuoteTypeEnum = zod_1.z.enum([
    "PRE_GAME_RITUAL",
    "SPORTS_MANTRA",
    "PET_PEEVE",
    "POST_GAME_CELEBRATION",
    "HYPE_SONG",
]);
exports.resetPasswordByTokenSchema = zod_1.z.object({
    token: zod_1.z.string({
        required_error: "Token is required",
        invalid_type_error: "Token must be a string",
    }),
    userId: zod_1.z.string({
        required_error: "Token2 is required",
        invalid_type_error: "Token2 must be a string",
    }),
    password: zod_1.z.string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string",
    }),
});
exports.gameScoreSchema = zod_1.z.object({
    level: zod_1.z.enum(["BEGINNER", "INTERMEDIATE", "PROFESSIONAL"]),
    gameId: zod_1.z.string().min(1, "Game ID is required"),
    frequency: zod_1.z.number().int().min(0),
    userSelfRating: zod_1.z.number().int().min(0).max(100),
    startDate: zod_1.z.string().min(1, "Start date is required"), // start date of playing this game
});
exports.forgetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
    }),
});
exports.userMiniSelection = {
    id: true,
    name: true,
    age: true,
    gamesPlayed: true,
    profileImage: {
        select: imageSchema_1.imageSelection,
    },
};
const userInputBaseSchema = zod_1.z.object({
    name: zod_1.z
        .string({
        required_error: "Name is required",
        invalid_type_error: "Name must be a string",
    })
        .min(1)
        .max(255),
    email: zod_1.z.string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
    }),
});
exports.userGameInputSchema = zod_1.z.object({
    gameId: zod_1.z.string().min(1, "Game ID is required"),
    level: zod_1.z.enum(["BEGINNER", "INTERMEDIATE", "PROFESSIONAL"]),
    startDate: zod_1.z.string().min(1, "Start date is required"),
    userSelfRating: zod_1.z.number().int().min(0).max(100),
    frequency: zod_1.z.number().int().min(0),
});
exports.locationInputSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    longitude: zod_1.z.number(),
    latitude: zod_1.z.number(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
});
exports.createUserSchema = userInputBaseSchema.extend({
    firebaseToken: zod_1.z.string().optional(),
    password: zod_1.z
        .string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string",
    })
        .min(6)
        .optional(),
    age: zod_1.z.number().optional(),
    quoteType: exports.QuoteTypeEnum.optional(),
    quoteAnswer: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string({
        required_error: "Phone number is required",
        invalid_type_error: "Phone number must be a string",
    }),
    gender: zod_1.z.enum(["MALE", "FEMALE", "UNSPECIFIED"]).optional(),
    skillLevel: zod_1.z
        .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
        .optional(),
    birthdate: zod_1.z
        .string({
        required_error: "Birthdate is required",
        invalid_type_error: "Birthdate must be a string",
    })
        .optional(),
    preferredTimes: zod_1.z
        .array(zod_1.z.enum(["MORNING", "AFTERNOON", "LATE_NIGHT", "ANYTIME"]))
        .optional(),
    profileImage: imageSchema_1.imageInputSchema.optional(),
    bySocial: zod_1.z.boolean().optional(),
    games: zod_1.z.array(exports.userGameInputSchema).optional(),
    gamesLevel: zod_1.z.array(exports.gameScoreSchema).optional(),
    locations: zod_1.z.array(exports.locationInputSchema).optional(),
    gamesPlayed: zod_1.z.number().int().min(0).optional(),
});
exports.updateUserSchema = zod_1.z.object({
    firebaseToken: zod_1.z.string().optional(),
    name: zod_1.z
        .string({
        required_error: "Name is required",
        invalid_type_error: "Name must be a string",
    })
        .min(1)
        .max(255)
        .optional(),
    // here
    email: zod_1.z
        .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
    })
        .email()
        .optional(),
    password: zod_1.z
        .string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string",
    })
        .min(6)
        .optional(),
    phoneNumber: zod_1.z
        .string({
        required_error: "Phone number is required",
        invalid_type_error: "Phone number must be a string",
    })
        .optional(),
    gender: zod_1.z.enum(["MALE", "FEMALE", "UNSPECIFIED"]).optional(),
    skillLevel: zod_1.z
        .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
        .optional(),
    birthdate: zod_1.z
        .string({
        required_error: "Birthdate is required",
        invalid_type_error: "Birthdate must be a string",
    })
        .optional(),
    preferredTimes: zod_1.z
        .array(zod_1.z.enum(["MORNING", "AFTERNOON", "LATE_NIGHT", "ANYTIME"]))
        .optional(),
    profileImage: imageSchema_1.imageInputSchema.optional(),
    bySocial: zod_1.z.boolean().optional(),
    games: zod_1.z.array(exports.userGameInputSchema).optional(),
    gamesLevel: zod_1.z.array(exports.gameScoreSchema).optional(),
    locations: zod_1.z.array(exports.locationInputSchema).optional(),
    age: zod_1.z.number().optional(),
    quoteType: exports.QuoteTypeEnum.optional(),
    quoteAnswer: zod_1.z.string().optional(),
    gamesPlayed: zod_1.z.number().int().min(0).optional(),
    expoPushToken: zod_1.z.string().optional(),
});
exports.getFilteredUsersSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    isVerified: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    role: zod_1.z.enum(["REGULAR", "ADMIN"]).optional(),
});
exports.imageSchema = userInputBaseSchema.extend({});
exports.userInfoSelection = {
    profileImage: { select: imageSchema_1.imageSelection },
    email: true,
    name: true,
};
exports.userSelection = {
    id: true,
    name: true,
    email: true,
    bySocial: true,
    profileImage: true,
    phoneNumber: true,
    role: true,
    gender: true,
    otp: true,
    isVerified: true,
    quoteType: true,
    quoteAnswer: true,
    deactivated: true,
    games: {
        select: {
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
            level: true,
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
    gamesPlayed: true,
    joinedMatches: {
        select: {
            match: {
                select: {
                    id: true,
                    location: true,
                    scheduledAt: true,
                    maxPlayers: true,
                    pricePerUser: true,
                    game: {
                        select: {
                            name: true,
                            image: true,
                        },
                    },
                },
            },
        },
    },
};
// userSchema.ts
exports.userWithParticipatedMatchesSelection = {
    id: true,
    name: true,
    email: true,
    bySocial: true,
    profileImage: true,
    phoneNumber: true,
    role: true,
    gender: true,
    otp: true,
    isVerified: true,
    age: true,
    quoteAnswer: true,
    quoteType: true,
    gamesPlayed: true,
    games: {
        select: {
            level: true,
            game: {
                select: {
                    id: true,
                    name: true,
                    image: true, // optional
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
    joinedMatches: {
        select: {
            match: {
                select: {
                    id: true,
                    location: true,
                    scheduledAt: true,
                    maxPlayers: true,
                    pricePerUser: true,
                    durationMins: true,
                    status: true,
                    game: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
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
                        },
                    },
                    participants: {
                        select: {
                            userId: true,
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    profileImage: true,
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
                                },
                            },
                        },
                    },
                    results: true,
                },
            },
        },
    },
    achievements: {
        select: {
            achievement: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            createdAt: true,
        },
    },
    locations: {
        select: {
            id: true,
            name: true,
            longitude: true,
            latitude: true,
            city: true,
            country: true,
        },
    },
};
exports.userSelectionForLogin = {
    id: true,
    name: true,
    email: true,
    bySocial: true,
    profileImage: true,
    phoneNumber: true,
    role: true,
    gender: true,
    otp: true,
    isVerified: true,
    games: true,
    gamesPlayed: true,
};
exports.userOtpSelection = {
    ...exports.userSelection,
    otp: true,
};
exports.loginUserSchema = zod_1.z.object({
    email: zod_1.z
        .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
    })
        .email(),
    password: zod_1.z
        .string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string",
    })
        .min(6)
        .optional(),
    bySocial: zod_1.z.boolean().optional(),
    firebaseToken: zod_1.z.string().optional(),
});
exports.checkPhoneSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string({
        required_error: "Phone number is required",
        invalid_type_error: "Phone number must be a string",
    }),
});
exports.checkEmailSchema = zod_1.z.object({
    email: zod_1.z
        .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
    })
        .email(),
});
exports.userResponseBaseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().nullable(),
    lastName: zod_1.z.string().nullable(),
    email: zod_1.z.string(),
    phone: zod_1.z.string().nullable(),
    profileImage: imageSchema_1.imageResponseSchema.nullable(),
    gender: zod_1.z
        .union([zod_1.z.literal("MALE"), zod_1.z.literal("FEMALE"), zod_1.z.literal("UNSPECIFIED")])
        .nullable(),
    nationality: zod_1.z.string().nullable(),
    bySocial: zod_1.z.boolean().nullable(),
    role: zod_1.z.string(),
    programType: zod_1.z.string().nullable().optional(),
    programName: zod_1.z.string().nullable().optional(),
    graduationYear: zod_1.z.string().nullable().optional(),
});
exports.getUserByIdSchema = zod_1.z.object({
    id: zod_1.z.string({
        required_error: "User ID is required",
        invalid_type_error: "User ID must be a string",
    }),
});
exports.publicUserSelection = {
    id: true,
    name: true,
    age: true,
    quoteType: true,
    quoteAnswer: true,
    gamesPlayed: true,
    profileImage: {
        select: imageSchema_1.imageSelection,
    },
    games: {
        select: {
            level: true,
            game: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    },
    receivedRatings: {
        select: {
            rating: true,
        },
    },
    achievements: {
        select: {
            achievement: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            createdAt: true,
        },
    },
};
