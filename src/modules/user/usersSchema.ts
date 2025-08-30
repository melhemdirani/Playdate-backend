import { z } from "zod";
import {
  imageInputSchema,
  imageResponseSchema,
  imageSelection,
} from "../variants/image/imageSchema";
import { gameSelection } from "../game/gameSchema";

export const QuoteTypeEnum = z.enum([
  "PRE_GAME_RITUAL",
  "SPORTS_MANTRA",
  "PET_PEEVE",
  "POST_GAME_CELEBRATION",
  "HYPE_SONG",
]);

export const resetPasswordByTokenSchema = z.object({
  token: z.string({
    required_error: "Token is required",
    invalid_type_error: "Token must be a string",
  }),
  userId: z.string({
    required_error: "Token2 is required",
    invalid_type_error: "Token2 must be a string",
  }),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  }),
});
export const gameScoreSchema = z.object({
  level: z.enum(["BEGINNER", "INTERMEDIATE", "PROFESSIONAL"]),
  gameId: z.string().min(1, "Game ID is required"),
  frequency: z.number().int().min(0), // monthly frequency of play
  userSelfRating: z.number().int().min(0).max(100), // self-rating percentage
  startDate: z.string().min(1, "Start date is required"), // start date of playing this game
});

export const forgetPasswordSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  }),
});

export const userMiniSelection = {
  id: true,
  name: true,
  age: true,
  gamesPlayed: true,
  profileImage: {
    select: imageSelection,
  },
};

const userInputBaseSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .min(1)
    .max(255),

  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  }),
});
export const userGameInputSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "PROFESSIONAL"]),
  startDate: z.string().min(1, "Start date is required"),
  userSelfRating: z.number().int().min(0).max(100),
  frequency: z.number().int().min(0),
});
export const locationInputSchema = z.object({
  name: z.string().optional(),
  longitude: z.number(),
  latitude: z.number(),
  city: z.string().optional(),
  country: z.string().optional(),
});
export const createUserSchema = userInputBaseSchema.extend({
  firebaseToken: z.string().optional(),

  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(6)
    .optional(),
  age: z.number().optional(),
  quoteType: QuoteTypeEnum.optional(),
  quoteAnswer: z.string().optional(),
  phoneNumber: z.string({
    required_error: "Phone number is required",
    invalid_type_error: "Phone number must be a string",
  }),

  gender: z.enum(["MALE", "FEMALE", "UNSPECIFIED"]).optional(),
  skillLevel: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .optional(),

  birthdate: z
    .string({
      required_error: "Birthdate is required",
      invalid_type_error: "Birthdate must be a string",
    })
    .optional(),
  preferredTimes: z
    .array(z.enum(["MORNING", "AFTERNOON", "LATE_NIGHT", "ANYTIME"]))
    .optional(),
  profileImage: imageInputSchema.optional(),
  bySocial: z.boolean().optional(),
  games: z.array(userGameInputSchema).optional(), // TODO: remove this and use gamesLevel
  gamesLevel: z.array(gameScoreSchema).optional(),
  locations: z.array(locationInputSchema).optional(),
  gamesPlayed: z.number().int().min(0).optional(),
});

export const updateUserSchema = z.object({
  firebaseToken: z.string().optional(),
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .min(1)
    .max(255)
    .optional(),
  // here
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email()
    .optional(),
  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(6)
    .optional(),

  phoneNumber: z
    .string({
      required_error: "Phone number is required",
      invalid_type_error: "Phone number must be a string",
    })
    .optional(),

  gender: z.enum(["MALE", "FEMALE", "UNSPECIFIED"]).optional(),
  skillLevel: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .optional(),

  birthdate: z
    .string({
      required_error: "Birthdate is required",
      invalid_type_error: "Birthdate must be a string",
    })
    .optional(),
  preferredTimes: z
    .array(z.enum(["MORNING", "AFTERNOON", "LATE_NIGHT", "ANYTIME"]))
    .optional(),
  profileImage: imageInputSchema.optional(),
  bySocial: z.boolean().optional(),
  games: z.array(userGameInputSchema).optional(),
  gamesLevel: z.array(gameScoreSchema).optional(),
  locations: z.array(locationInputSchema).optional(),
  age: z.number().optional(),
  quoteType: QuoteTypeEnum.optional(),
  quoteAnswer: z.string().optional(),
  gamesPlayed: z.number().int().min(0).optional(),
  expoPushToken: z.string().optional(),
});
export const getFilteredUsersSchema = z.object({
  search: z.string().optional(),
  page: z.string().optional(),
  isVerified: z.string().optional(),
  limit: z.string().optional(),
  role: z.enum(["REGULAR", "ADMIN"]).optional(),
});

export type ScoreInput = z.infer<typeof gameScoreSchema>;
export type GetFilteredUsersInput = z.infer<typeof getFilteredUsersSchema>;

export const imageSchema = userInputBaseSchema.extend({});

export const userInfoSelection = {
  profileImage: { select: imageSelection },
  email: true,
  name: true,
};

export const userSelection = {
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

export const userWithParticipatedMatchesSelection = {
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

export const userSelectionForLogin = {
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

export const userOtpSelection = {
  ...userSelection,
  otp: true,
};

export const loginUserSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email(),

  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(6)
    .optional(),

  bySocial: z.boolean().optional(),

  firebaseToken: z.string().optional(),
});

export const checkPhoneSchema = z.object({
  phoneNumber: z.string({
    required_error: "Phone number is required",
    invalid_type_error: "Phone number must be a string",
  }),
});

export const checkEmailSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email(),
});

export const userResponseBaseSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  profileImage: imageResponseSchema.nullable(),
  gender: z
    .union([z.literal("MALE"), z.literal("FEMALE"), z.literal("UNSPECIFIED")])
    .nullable(),
  nationality: z.string().nullable(),
  bySocial: z.boolean().nullable(),
  role: z.string(),
  programType: z.string().nullable().optional(),
  programName: z.string().nullable().optional(),
  graduationYear: z.string().nullable().optional(),
});

export type UserResponse = z.infer<typeof userResponseBaseSchema>;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordByTokenInput = z.infer<
  typeof resetPasswordByTokenSchema
>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type CheckPhoneInput = z.infer<typeof checkPhoneSchema>;
export type CheckEmailInput = z.infer<typeof checkEmailSchema>;

export const getUserByIdSchema = z.object({
  id: z.string({
    required_error: "User ID is required",
    invalid_type_error: "User ID must be a string",
  }),
});

export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;

export const publicUserSelection = {
  id: true,
  name: true,
  age: true,
  quoteType: true,
  quoteAnswer: true,
  gamesPlayed: true,
  profileImage: {
    select: imageSelection,
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
