import { z } from "zod";
import { NoShowReasonType } from "@prisma/client";
import { userMiniSelection } from "../user/usersSchema";
import { MatchStatus, MatchOutcome } from "@prisma/client";

export const LocationSchema = z.object({
  name: z.string().optional(),
  longitude: z.number(),
  latitude: z.number(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const createMatchSchema = z.object({
  gameId: z.string(),
  location: LocationSchema,
  scheduledAt: z.string().datetime(),
  maxPlayers: z.number().int().positive(),
  pricePerUser: z.number().positive(),
  durationMins: z.number().int().positive().optional(),
  status: z.nativeEnum(MatchStatus).optional(),
});

export const updateMatchSchema = z.object({
  location: LocationSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
  maxPlayers: z.number().int().positive().optional(),
  pricePerUser: z.number().positive().optional(),
  durationMins: z.number().int().positive().optional(),
  status: z.nativeEnum(MatchStatus).optional(),
});

export const getMatchesQuerySchema = z.object({
  gameId: z.string().optional(),
  locationId: z.string().optional(),
  // status: z.nativeEnum(MatchStatus).optional(),
  status: z.string().optional(),
  creatorId: z.string().optional(),
  userId: z.string().optional(), // For excluding matches the user is in
  // Add other query parameters as needed
});
export const getRecommendedMatchesQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Date must be in YYYY-MM-DD format",
    })
    .optional(),
  time: z.enum(["MORNING", "AFTERNOON", "LATE_NIGHT"]).optional(),
  sortBy: z.enum(["scheduledAt", "pricePerUser"]).optional(),
  gender: z.enum(["MALE", "FEMALE", "ANYONE"]).optional(),
  gameId: z.string().optional(),
  longitude: z.coerce.number().optional(),
  latitude: z.coerce.number().optional(),
});

export type GetRecommendedMatchesQueryInput = z.infer<
  typeof getRecommendedMatchesQuerySchema
>;

export const reportMatchResultSchema = z.object({
  outcome: z.nativeEnum(MatchOutcome),
  ratings: z
    .record(
      z.string(),
      z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .optional(),
});

export const updateMatchOutcomeSchema = z.object({
  outcome: z.nativeEnum(MatchOutcome),
});

export const submitPlayerRatingsSchema = z.object({
  ratings: z.record(
    z.string(),
    z.object({
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    })
  ),
});

export const reportNoShowSchema = z.object({
  reportedUserIds: z.array(z.string()),
  reason: z.string().optional(),
});

export const submitNoShowReasonSchema = z
  .object({
    reason: z.nativeEnum(NoShowReasonType),
    customReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.reason === NoShowReasonType.OTHER && !data.customReason) {
        return false;
      }
      return true;
    },
    {
      message: "Custom reason is required when 'OTHER' is selected",
      path: ["customReason"],
    }
  );

export const rescheduleMatchSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "newDate must be in YYYY-MM-DD format",
  }),
  newTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, { message: "newTime must be in HH:MM format" }),
});

export const cancelMatchSchema = z.object({
  cancellationReason: z.string(),
  customCancellationReason: z.string().optional(),
});

export const leaveMatchSchema = z.object({
  cancellationReason: z.string(),
  customCancellationReason: z.string().optional(),
});

export type RescheduleMatchInput = z.infer<typeof rescheduleMatchSchema>;
export type ReportMatchResultInput = z.infer<typeof reportMatchResultSchema>;
export type SubmitNoShowReasonInput = z.infer<typeof submitNoShowReasonSchema>;
export type LeaveMatchInput = z.infer<typeof leaveMatchSchema>;

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type GetMatchesQueryInput = z.infer<typeof getMatchesQuerySchema>;
// export type GetRecommendedMatchesQueryInput = z.infer<
//   typeof getRecommendedMatchesQuerySchema
// >;
export const matchParticipantUserSelection = {
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

export const matchParticipantSelection = {
  userId: true,
  joinedAt: true,
  team: true,
  user: {
    select: matchParticipantUserSelection,
  },
};

export const matchSelection = {
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
      ...userMiniSelection,
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
      ...matchParticipantSelection,
      user: {
        select: {
          ...matchParticipantUserSelection,
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
