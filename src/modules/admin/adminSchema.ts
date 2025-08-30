import { z } from "zod";
import { UserStatus, Role } from "@prisma/client";
export const approveMatchRequestSchema = z.object({
  id: z.string().optional(),
  gameId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  maxPlayers: z.number().int().optional(),
  pricePerUser: z.number().optional(),
  durationMins: z.number().int().optional(),
});

export const editMatchRequestSchema = z.object({
  id: z.string(),
  gameId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  maxPlayers: z.number().int().optional(),
  pricePerUser: z.number().optional(),
  durationMins: z.number().int().optional(),
  // status: z
  //   .enum(["PENDING", "APPROVED", "DECLINED", "EDITED_AND_APPROVED"])
  //   .optional(),
});

export const declineMatchRequestSchema = z.object({
  id: z.string(),
});

// Define enums manually until Prisma regenerates
const PaymentStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
} as const;

const UserReportReason = {
  INAPPROPRIATE_BEHAVIOR: "INAPPROPRIATE_BEHAVIOR",
  HARASSMENT: "HARASSMENT",
  CHEATING: "CHEATING",
  NO_SHOW: "NO_SHOW",
  FAKE_PROFILE: "FAKE_PROFILE",
  SPAM: "SPAM",
  OTHER: "OTHER",
} as const;

const ReportStatus = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;

// User Management Schemas
export const getUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  search: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(Role).optional(),
  sortBy: z.enum(["createdAt", "name", "email", "gamesPlayed"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const getUserByIdSchema = z.object({
  id: z.string(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(Role).optional(),
  phoneNumber: z.string().optional(),
  password: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  age: z.number().optional(),
  quoteType: z.string().optional(),
  quoteAnswer: z.string().optional(),
  skillLevel: z.string().optional(),
  gamesPlayed: z.number().optional(),
  isVerified: z.boolean().optional(),
  bySocial: z.boolean().optional(),
  lastLoginDate: z.string().optional(),
  deactivated: z.boolean().optional(),
  expoPushToken: z.string().optional(),
  profileImage: z.any().optional(),
  preferredTimes: z.any().optional(),
  locations: z.any().optional(),
  games: z.any().optional(),
  createdMatches: z.any().optional(),
  joinedMatches: z.any().optional(),
  matchResults: z.any().optional(),
  reportedNoShows: z.any().optional(),
  reportedByNoShows: z.any().optional(),
  givenRatings: z.any().optional(),
  receivedRatings: z.any().optional(),
  refreshTokens: z.any().optional(),
  logs: z.any().optional(),
  forgotPassword: z.any().optional(),
  notifications: z.any().optional(),
  achievements: z.any().optional(),
  chatMessages: z.any().optional(),
  payments: z.any().optional(),
  reportsMade: z.any().optional(),
  reportsReceived: z.any().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

// Match Management Schemas
export const getMatchesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  status: z.string().optional(),
  gameId: z.string().optional(),
  creatorId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "scheduledAt", "pricePerUser"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const getMatchRequestsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  status: z.string().optional(),
  gameId: z.string().optional(),
  requestedById: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "scheduledAt", "maxPlayers"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const updateMatchSchema = z.object({
  status: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const createAdminMatchSchema = z.object({
  gameId: z.string(),
  location: z.object({
    name: z.string().optional(),
    longitude: z.number(),
    latitude: z.number(),
    city: z.string().optional(),
    country: z.string().optional(),
  }),
  scheduledAt: z.string().datetime(),
  maxPlayers: z.number().int().positive(),
  pricePerUser: z.number().positive(),
  durationMins: z.number().int().positive().optional(),
});

// Game Management Schemas
export const createGameSchema = z.object({
  name: z.string(),
  imageId: z.string().optional(),
});

export const updateGameSchema = z.object({
  name: z.string().optional(),
  imageId: z.string().optional(),
  image: z
    .object({
      publicId: z.string(),
      url: z.string(),
      fileName: z.string(),
    })
    .optional(),
});

// Report Management Schemas
export const getReportsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  status: z
    .enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"])
    .optional(),
  reason: z
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
  reporterId: z.string().optional(),
  reportedId: z.string().optional(),
  sortBy: z.enum(["createdAt", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const updateReportSchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
  adminNotes: z.string().optional(),
});

export const createUserReportSchema = z.object({
  reportedId: z.string(),
  reason: z.enum([
    "INAPPROPRIATE_BEHAVIOR",
    "HARASSMENT",
    "CHEATING",
    "NO_SHOW",
    "FAKE_PROFILE",
    "SPAM",
    "OTHER",
  ]),
  description: z.string().optional(),
});

// Payment Analytics Schemas
export const getPaymentAnalyticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(["day", "week", "month", "year"]).optional().default("month"),
});

export const getPaymentsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  status: z
    .enum([
      "PENDING",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
    ])
    .optional(),
  userId: z.string().optional(),
  matchId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["createdAt", "amount"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Refund Schemas
export const createRefundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1, "Refund reason is required"),
});

export const getRefundsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  userId: z.string().optional(),
  matchId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["createdAt", "amount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Selection objects for consistent data return
export const userAdminSelection = {
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

export const matchAdminSelection = {
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

export const matchRequestAdminSelection = {
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

export const reportAdminSelection = {
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

export const paymentAdminSelection = {
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

// Type exports
export type CreateAdminMatchInput = z.infer<typeof createAdminMatchSchema>;
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type GetMatchesQueryInput = z.infer<typeof getMatchesQuerySchema>;
export type GetMatchRequestsQueryInput = z.infer<
  typeof getMatchRequestsQuerySchema
>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
export type GetReportsQueryInput = z.infer<typeof getReportsQuerySchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type CreateUserReportInput = z.infer<typeof createUserReportSchema>;
export type GetPaymentAnalyticsInput = z.infer<
  typeof getPaymentAnalyticsSchema
>;
export type GetPaymentsQueryInput = z.infer<typeof getPaymentsQuerySchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type GetRefundsQueryInput = z.infer<typeof getRefundsQuerySchema>;
