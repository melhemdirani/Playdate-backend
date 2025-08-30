export async function approveMatchRequest(id: string, matchData?: any) {
  // Update MatchRequest status to APPROVED
  const matchRequest = await prisma.matchRequest.update({
    where: { id },
    data: { status: "APPROVED" },
    include: {
      game: true,
      location: true,
      requestedBy: true,
    },
  });

  // Use body fields for match creation, fallback to matchRequest if missing
  const {
    gameId = matchRequest.gameId,
    locationId = matchRequest.locationId,
    scheduledAt = matchRequest.scheduledAt,
    maxPlayers = matchRequest.maxPlayers,
    pricePerUser,
    durationMins,
    creatorId = matchRequest.requestedById,
  } = matchData || {};

  if (typeof pricePerUser !== "number" || pricePerUser <= 0) {
    throw new Error(
      "Admin must set pricePerUser before approving the match request."
    );
  }
  const location =
    matchData?.location ||
    (matchRequest.location
      ? {
          name: matchRequest.location.name,
          longitude: matchRequest.location.longitude,
          latitude: matchRequest.location.latitude,
          city: matchRequest.location.city,
          country: matchRequest.location.country,
        }
      : undefined);

  const dataObj: CreateMatchInput = {
    gameId,
    location,
    scheduledAt,
    maxPlayers,
    pricePerUser,
    durationMins,
    status: "UPCOMING",
  };

  const match = await createMatchFromRequest(dataObj, creatorId);

  // Send match request approved notification to the creator
  if (match) {
    // Check if this is a rescheduled match by looking at adminNote
    const isRescheduled = matchRequest.adminNote?.includes(
      "Rescheduled from match"
    );

    if (isRescheduled) {
      // Extract original participant IDs from adminNote and notify them
      const participantMatch = matchRequest.adminNote?.match(
        /Original participants: (.+)/
      );
      if (participantMatch) {
        const originalParticipantIds = participantMatch[1]
          .split(", ")
          .map((id) => id.trim());

        // Send rescheduled notification to all original participants
        for (const participantId of originalParticipantIds) {
          await createNotification({
            userId: participantId,
            type: "match_rescheduled",
            data: {
              gameType: match.game?.name,
              matchDate: match.scheduledAt
                ? new Date(match.scheduledAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : undefined,
              game: match.game,
              match,
              originalMatchId: matchRequest.adminNote?.match(
                /Rescheduled from match (\w+)/
              )?.[1],
            },
            redirectLink: `/match-details/${match.id}`,
          });
        }
      }
    }

    // Always send match request approved notification to the creator
    await createNotification({
      userId: creatorId,
      type: "match_request_approved",
      data: {
        gameType: match.game?.name,
        matchDate: match.scheduledAt
          ? new Date(match.scheduledAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
        game: match.game,
        match,
      },
      redirectLink: `/match-details/${match.id}`,
    });
  }

  return { matchRequest, match };
}

export async function editMatchRequest(id: string, updateData: any) {
  // Update MatchRequest with provided data
  const matchRequest = await prisma.matchRequest.update({
    where: { id },
    data: updateData,
    include: {
      game: true,
      location: true,
      requestedBy: true,
    },
  });
  // If status is EDITED_AND_APPROVED, create a match
  let match = null;
  if (matchRequest.status === "EDITED_AND_APPROVED") {
    if (
      typeof matchRequest.pricePerUser !== "number" ||
      matchRequest.pricePerUser <= 0
    ) {
      throw new Error(
        "Admin must set pricePerUser before approving the match request."
      );
    }
    match = await prisma.match.create({
      data: {
        gameId: matchRequest.gameId,
        locationId: matchRequest.locationId,
        scheduledAt: matchRequest.scheduledAt,
        maxPlayers: matchRequest.maxPlayers,
        pricePerUser: matchRequest.pricePerUser,
        creatorId: matchRequest.requestedById,
        status: "UPCOMING",
      },
    });
  }
  return { matchRequest, match };
}

export async function declineMatchRequest(id: string) {
  // Update MatchRequest status to DECLINED
  const matchRequest = await prisma.matchRequest.update({
    where: { id },
    data: { status: "DECLINED" },
  });
  // If a match was already created, mark it as canceled
  const match = await prisma.match.findFirst({
    where: {
      gameId: matchRequest.gameId,
      locationId: matchRequest.locationId,
      scheduledAt: matchRequest.scheduledAt,
      creatorId: matchRequest.requestedById,
    },
  });
  if (match) {
    await prisma.match.update({
      where: { id: match.id },
      data: { status: "CANCELLED" },
    });
  }
  return matchRequest;
}
export async function acceptMatchRequest(
  matchRequestId: string,
  adminId: string,
  edits?: Partial<{
    scheduledAt: Date;
    maxPlayers: number;
    pricePerUser: number;
    locationId: string;
    gameId: string;
    adminNote: string;
  }>
) {
  if (!matchRequestId || !adminId)
    throw new BadRequestError("MatchRequest ID and Admin ID are required");

  // Find the request
  const matchRequest = await prisma.matchRequest.findUnique({
    where: { id: matchRequestId },
  });
  if (!matchRequest) throw new NotFoundError("Match request not found");

  let status = "APPROVED";
  let updateData: any = {
    status,
    approvedById: adminId,
    adminNote: edits?.adminNote,
  };
  if (edits) {
    status = "EDITED_AND_APPROVED";
    updateData = {
      ...updateData,
      ...edits,
      status,
    };
  }

  // Update the request
  const updatedRequest = await prisma.matchRequest.update({
    where: { id: matchRequestId },
    data: updateData,
  });
  return updatedRequest;
}
// import { User } from "../user/userModel"; // Assuming there's a User model defined
// import { Course } from "../courses/coursesModel"; // Assuming there's a Course model defined

import { PrismaClient } from "@prisma/client";
import { createNotification } from "../notification/notificationService";

const prisma = new PrismaClient();
import { BadRequestError, NotFoundError } from "../../errors";
import { GetFilteredUsersInput, userSelection } from "../user/usersSchema";
import { Prisma, Role, UserStatus } from "@prisma/client";
import {
  processPaymentRefund,
  getRefundAnalytics,
  validateRefundEligibility,
} from "./refundService";
import {
  GetUsersQueryInput,
  GetUserByIdInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  GetMatchesQueryInput,
  GetMatchRequestsQueryInput,
  UpdateMatchInput,
  CreateGameInput,
  UpdateGameInput,
  GetReportsQueryInput,
  UpdateReportInput,
  CreateUserReportInput,
  GetPaymentAnalyticsInput,
  GetPaymentsQueryInput,
  CreateRefundInput,
  GetRefundsQueryInput,
  userAdminSelection,
  matchAdminSelection,
  matchRequestAdminSelection,
  reportAdminSelection,
  paymentAdminSelection,
  CreateAdminMatchInput,
} from "./adminSchema";
import { createMatch } from "../match/matchService";
import { CreateMatchInput } from "../match/matchSchema";
import { createMatchFromRequest } from "../match/matchService";

// Legacy functions - keeping for compatibility
export async function acceptUserSignup(userId: string | undefined) {
  if (!userId) throw new BadRequestError("User ID is required");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "ACCEPTED" },
  });

  return user;
}

export async function rejectUserSignup(userId: string | undefined) {
  if (!userId) throw new BadRequestError("User ID is required");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "REJECTED" },
  });
  return user;
}

export async function approveUser(userId: string | undefined) {
  if (!userId) {
    throw new BadRequestError("User ID is required");
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });
  return user;
}

export async function disApproveUser(userId: string | undefined) {
  if (!userId) {
    throw new BadRequestError("User ID is required");
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isVerified: false },
  });
  return user;
}

export async function getFilteredUsers(params: GetFilteredUsersInput) {
  const page = params.page ? parseInt(params.page) : 1;
  const limit = params.limit ? parseInt(params.limit) : 10;
  const query = {
    where: {
      AND: [],
    },

    orderBy: {} as unknown,
    skip: (page - 1) * limit,
    take: limit,
    select: userSelection,
  } as Prisma.UserFindManyArgs & {
    where: { AND: Prisma.UserWhereInput[] };
  } & {
    skip: number;
  } & { take: number };

  if (params.isVerified) {
    query.where.AND.push({
      isVerified: params.isVerified === "true" ? true : false,
    });
  }
  if (params.search) {
    query.where.AND.push({
      OR: [
        {
          name: {
            contains: params.search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: params.search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (params.role as Role) {
    query.where.AND.push({
      role: params.role,
    });
  }

  const totalUsers = await prisma.user.count({ where: query.where });
  const numOfPages = Math.ceil(totalUsers / limit);
  const users = await prisma.user.findMany({
    ...query,
    select: userSelection,
  });

  return { totalUsers, numOfPages, users: users };
}

// NEW ADMIN FUNCTIONS

// User Management
export async function getAllUsers(params: GetUsersQueryInput) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    role,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (role) {
    where.role = role;
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: userAdminSelection,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userAdminSelection,
      phoneNumber: true,
      birthdate: true,
      gender: true,
      age: true,
      quoteType: true,
      quoteAnswer: true,
      skillLevel: true,
      firebaseUid: true,
      isVerified: true,
      bySocial: true,
      createdAt: true,
      profileImage: {
        select: {
          id: true,
          url: true,
          publicId: true,
          fileName: true,
        },
      },
      locations: {
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
        },
      },
      games: {
        select: {
          level: true,
          game: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Matches played
  const matchesPlayed = await prisma.matchParticipant.count({
    where: { userId: userId },
  });

  // Matches won
  const matchesWon = await prisma.matchResult.count({
    where: { userId: userId, outcome: "WON" },
  });

  // Total spent
  const totalSpentResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      userId: userId,
      status: { in: ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"] },
    },
  });
  const totalSpent = totalSpentResult._sum.amount || 0;

  // Total refunds received
  const totalRefundsResult = await prisma.payment.aggregate({
    _sum: { refundAmount: true },
    where: {
      userId: userId,
      status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] },
    },
  });
  const totalRefunds = totalRefundsResult._sum.refundAmount || 0;

  // Overall rating (average)
  const overallRatingResult = await prisma.rating.aggregate({
    _avg: { rating: true },
    _count: { rating: true },
    where: { ratedId: userId },
  });
  const overallRating = overallRatingResult._avg.rating || null;
  const totalRatings = overallRatingResult._count.rating || 0;

  // Reports received (count)
  const reportsReceivedCount = await prisma.userReport.count({
    where: { reportedId: userId },
  });

  // Reports received (detailed)
  const reportsReceived = await prisma.userReport.findMany({
    where: { reportedId: userId },
    select: {
      id: true,
      reason: true,
      description: true,
      status: true,
      createdAt: true,
      reporter: { select: { id: true, name: true } },
    },
  });

  // Reports made (count)
  const reportsMadeCount = await prisma.userReport.count({
    where: { reporterId: userId },
  });

  // Reports made (detailed)
  const reportsMade = await prisma.userReport.findMany({
    where: { reporterId: userId },
    select: {
      id: true,
      reason: true,
      description: true,
      status: true,
      createdAt: true,
      reported: { select: { id: true, name: true } },
    },
  });

  // Recent activities (last 10)
  const recentActivities = await prisma.userActivity.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, activity: true, details: true, createdAt: true },
  });

  // Matches created
  const matchesCreated = await prisma.match.count({
    where: { creatorId: userId },
  });

  // Achievements earned by the user
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const achievements = userAchievements.map((ua) => ({
    achievementId: ua.achievementId,
    name: ua.achievement?.name ?? null,
    image: ua.achievement?.image ?? null,
    unlockedAt: ua.createdAt,
  }));

  return {
    ...user,
    matchesPlayed,
    matchesWon,
    totalSpent,
    totalRefunds,
    overallRating,
    totalRatings,
    reportsReceivedCount,
    reportsReceived,
    reportsMadeCount,
    reportsMade,
    recentActivities,
    matchesCreated,
    achievements,
  };
}

export async function updateUserById(userId: string, data: UpdateUserInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Filter out fields that should not be directly updated or need special handling
  const updateData: any = {};

  // Basic fields that can be updated directly
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.status) updateData.status = data.status;
  if (data.role) updateData.role = data.role;
  if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
  if (data.password) updateData.password = data.password;
  if (data.birthdate) updateData.birthdate = data.birthdate;
  if (data.gender) updateData.gender = data.gender as any;
  if (data.age !== undefined) updateData.age = data.age;
  if (data.quoteType) updateData.quoteType = data.quoteType as any;
  if (data.quoteAnswer) updateData.quoteAnswer = data.quoteAnswer;
  if (data.skillLevel) updateData.skillLevel = data.skillLevel as any;
  if (data.gamesPlayed !== undefined) updateData.gamesPlayed = data.gamesPlayed;
  if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
  if (data.bySocial !== undefined) updateData.bySocial = data.bySocial;
  if (data.deactivated !== undefined) updateData.deactivated = data.deactivated;
  if (data.expoPushToken) updateData.expoPushToken = data.expoPushToken;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: userAdminSelection,
  });

  return updatedUser;
}

export async function updateUserStatus(
  userId: string,
  data: UpdateUserStatusInput
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: data.status },
    select: userAdminSelection,
  });

  // Send notifications based on status change
  if (data.status === "SUSPENDED" || data.status === "BANNED") {
    await createNotification({
      userId: userId,
      type: "account_under_review",
      data: {
        status: data.status,
        previousStatus: user.status,
      },
      // redirectLink: `/profile/account-status`,
    });
  } else if (data.status === "REJECTED") {
    // await createNotification({
    //   userId: userId,
    //   type: "suspicious_activity",
    //   data: {
    //     status: data.status,
    //     previousStatus: user.status,
    //   },
    //   redirectLink: `/profile/security`,
    // });
  }

  return updatedUser;
}

export async function deleteUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: "User deleted successfully" };
}

// Match Management
export async function getAllMatches(params: GetMatchesQueryInput) {
  const {
    page = 1,
    limit = 10,
    status,
    gameId,
    creatorId,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.MatchWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  if (gameId) {
    where.gameId = gameId;
  }

  if (creatorId) {
    where.creatorId = creatorId;
  }

  if (search) {
    where.OR = [
      { createdBy: { name: { contains: search, mode: "insensitive" } } },
      { location: { name: { contains: search, mode: "insensitive" } } },
      { location: { city: { contains: search, mode: "insensitive" } } },
    ];
  }

  const orderBy: Prisma.MatchOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [matches, totalMatches] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: matchAdminSelection,
    }),
    prisma.match.count({ where }),
  ]);

  return {
    matches,
    totalMatches,
    totalPages: Math.ceil(totalMatches / limit),
    currentPage: page,
  };
}

export async function getMatchById(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      ...matchAdminSelection,
      participants: {
        select: {
          status: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      results: {
        select: {
          outcome: true,
          reportedAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  return match;
}

// Match Request Management
export async function getAllMatchRequests(params: GetMatchRequestsQueryInput) {
  console.log("getAllMatchRequests called with params:", params);
  const {
    page = 1,
    limit = 10,
    status,
    gameId,
    requestedById,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.MatchRequestWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  if (gameId) {
    where.gameId = gameId;
  }

  if (requestedById) {
    where.requestedById = requestedById;
  }

  if (search) {
    where.OR = [
      { requestedBy: { name: { contains: search, mode: "insensitive" } } },
      { location: { name: { contains: search, mode: "insensitive" } } },
      { location: { city: { contains: search, mode: "insensitive" } } },
      { adminNote: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.MatchRequestOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  console.log("Query where clause:", where);
  console.log("Query orderBy:", orderBy);

  const [matchRequests, totalMatchRequests] = await Promise.all([
    prisma.matchRequest.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: matchRequestAdminSelection,
    }),
    prisma.matchRequest.count({ where }),
  ]);

  const result = {
    matchRequests,
    totalMatchRequests,
    totalPages: Math.ceil(totalMatchRequests / limit),
    currentPage: page,
  };

  console.log("getAllMatchRequests returning:", result);
  return result;
}

export async function updateMatchById(matchId: string, data: UpdateMatchInput) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  const updateData: any = {};
  if (data.status) {
    updateData.status = data.status;
  }
  if (data.cancellationReason) {
    updateData.cancellationReason = data.cancellationReason;
  }

  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data: updateData,
    select: matchAdminSelection,
  });

  // If admin is cancelling the match, send urgent notifications to all participants
  if (data.status === "CANCELLED") {
    const matchWithParticipants = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        game: {
          include: {
            image: true,
          },
        },
      },
    });

    if (
      matchWithParticipants &&
      matchWithParticipants.participants.length > 0
    ) {
      for (const participant of matchWithParticipants.participants) {
        await createNotification({
          userId: participant.userId,
          type: "admin_cancelled_booking",
          data: {
            matchId: matchWithParticipants.id,
            game: matchWithParticipants.game,
            scheduledAt: matchWithParticipants.scheduledAt,
            date: new Date(
              matchWithParticipants.scheduledAt
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            cancellationReason:
              data.cancellationReason || "Match cancelled by admin",
            participants: matchWithParticipants.participants.map((p) => ({
              userId: p.user.id,
              name: p.user.name,
              email: p.user.email,
            })),
          },
        });
      }
    }
  }

  return updatedMatch;
}

export async function deleteMatchById(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  await prisma.match.delete({
    where: { id: matchId },
  });

  return { message: "Match deleted successfully" };
}

// Game Management
export async function getAllGames() {
  const games = await prisma.game.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      image: {
        select: {
          id: true,
          url: true,
        },
      },
      _count: {
        select: {
          users: true,
          matches: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return games;
}

export async function getGameById(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      image: {
        select: {
          id: true,
          url: true,
        },
      },
      _count: {
        select: {
          users: true,
          matches: true,
        },
      },
    },
  });

  if (!game) {
    throw new NotFoundError("Game not found");
  }

  return game;
}

export async function createGame(data: CreateGameInput) {
  const game = await prisma.game.create({
    data: {
      name: data.name as any,
      imageId: data.imageId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      image: {
        select: {
          id: true,
          url: true,
        },
      },
    },
  });

  return game;
}

export async function updateGameById(gameId: string, data: UpdateGameInput) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new NotFoundError("Game not found");
  }

  let imageId = data.imageId;
  if (data.image) {
    if (imageId) {
      // Update existing image
      await prisma.image.update({
        where: { id: imageId },
        data: data.image,
      });
    } else {
      // Create new image
      const newImage = await prisma.image.create({
        data: data.image,
      });
      imageId = newImage.id;
    }
  }

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      ...(data.name && { name: data.name as any }),
      ...(imageId && { imageId }),
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      image: {
        select: {
          id: true,
          url: true,
          publicId: true,
          fileName: true,
        },
      },
    },
  });

  return updatedGame;
}

export async function deleteGameById(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new NotFoundError("Game not found");
  }

  await prisma.game.delete({
    where: { id: gameId },
  });

  return { message: "Game deleted successfully" };
}

// Report Management
export async function getAllReports(params: GetReportsQueryInput) {
  const {
    page = 1,
    limit = 10,
    status,
    reason,
    reporterId,
    reportedId,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (reason) where.reason = reason;
  if (reporterId) where.reporterId = reporterId;
  if (reportedId) where.reportedId = reportedId;

  // If filters are applied, only user reports will be considered to honor schema enums.
  const includeNoShowReports = !status && !reason && !reporterId && !reportedId;

  const userReportsPromise = prisma.userReport.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: {
            select: { id: true, url: true, publicId: true, fileName: true },
          },
        },
      },
      reported: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: {
            select: { id: true, url: true, publicId: true, fileName: true },
          },
        },
      },
    },
  });

  const noShowReportsPromise = includeNoShowReports
    ? prisma.noShowReport.findMany({
        orderBy: { createdAt: sortOrder as any },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: {
                select: { id: true, url: true, publicId: true, fileName: true },
              },
            },
          },
          reportedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: {
                select: { id: true, url: true, publicId: true, fileName: true },
              },
            },
          },
          match: {
            select: {
              id: true,
              game: { select: { id: true, name: true } },
              scheduledAt: true,
            },
          },
        },
      })
    : Promise.resolve([]);

  const [userReports, noShowReports] = await Promise.all([
    userReportsPromise,
    noShowReportsPromise,
  ]);

  // Normalize to a unified shape
  const normalizedUserReports = userReports.map((r) => ({
    id: r.id,
    type: "USER_REPORT" as const,
    reason: r.reason,
    description: r.description ?? null,
    status: r.status,
    adminNotes: r.adminNotes ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    reporter: r.reporter,
    reported: r.reported,
  }));

  const normalizedNoShowReports = (noShowReports as any[]).map((r) => ({
    id: r.id,
    type: "NO_SHOW_REPORT" as const,
    reason: r.reason, // NoShowReasonType
    description: r.reporterComment || r.customReason || null,
    status: "PENDING" as const, // No explicit workflow; treat as pending/default
    adminNotes: null as string | null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    reporter: r.reporter,
    reported: r.reportedUser,
    match: r.match,
  }));

  const combined = includeNoShowReports
    ? [...normalizedUserReports, ...normalizedNoShowReports]
    : normalizedUserReports;

  combined.sort((a, b) =>
    sortOrder === "asc"
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = combined.length;
  const pageItems = combined.slice(skip, skip + limit);

  return {
    reports: pageItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getReportById(reportId: string) {
  const report = await prisma.userReport.findUnique({
    where: { id: reportId },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      reported: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  return report;
}

export async function updateReportById(
  reportId: string,
  data: UpdateReportInput,
  adminId: string
) {
  const report = await prisma.userReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  const updateData: any = {
    status: data.status,
    adminNotes: data.adminNotes,
    updatedAt: new Date(),
  };

  // If the status is being resolved, set resolvedBy and resolvedAt
  if (data.status === "RESOLVED" && report.status !== "RESOLVED") {
    updateData.resolvedBy = adminId;
    updateData.resolvedAt = new Date();
  }

  const updatedReport = await prisma.userReport.update({
    where: { id: reportId },
    data: updateData,
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      reported: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  return updatedReport;
}

export async function createUserReport(
  data: CreateUserReportInput,
  reporterId: string
) {
  // Check if the reported user exists
  const reportedUser = await prisma.user.findUnique({
    where: { id: data.reportedId },
  });

  if (!reportedUser) {
    throw new NotFoundError("Reported user not found");
  }

  // Check if the reporter exists
  const reporter = await prisma.user.findUnique({
    where: { id: reporterId },
  });

  if (!reporter) {
    throw new NotFoundError("Reporter not found");
  }

  // Prevent self-reporting
  if (reporterId === data.reportedId) {
    throw new BadRequestError("Cannot report yourself");
  }

  const report = await prisma.userReport.create({
    data: {
      reporterId,
      reportedId: data.reportedId,
      reason: data.reason,
      description: data.description,
    },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      reported: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  return report;
}

export async function deleteReportById(reportId: string) {
  const report = await prisma.userReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  await prisma.userReport.delete({
    where: { id: reportId },
  });

  return { message: "Report deleted successfully" };
}

// Payment Analytics
export async function getPaymentAnalytics(params: GetPaymentAnalyticsInput) {
  const { startDate, endDate, period = "month" } = params;

  let dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  const where = startDate || endDate ? { createdAt: dateFilter } : {};

  // Total payments
  const totalPayments = await prisma.payment.count({ where });

  // Total revenue
  const revenueResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      ...where,
      status: { in: ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"] },
    },
  });
  const totalRevenue = revenueResult._sum.amount || 0;

  // Total refunds
  const refundResult = await prisma.payment.aggregate({
    _sum: { refundAmount: true },
    where: { ...where, status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] } },
  });
  const totalRefunds = refundResult._sum.refundAmount || 0;

  // Payment status breakdown
  const statusBreakdown = await prisma.payment.groupBy({
    by: ["status"],
    _count: { status: true },
    _sum: { amount: true },
    where,
  });

  return {
    totalPayments,
    totalRevenue,
    totalRefunds,
    netRevenue: totalRevenue - totalRefunds,
    statusBreakdown,
    period,
    dateRange: { startDate, endDate },
  };
}

export async function getAllPayments(params: GetPaymentsQueryInput) {
  const {
    page = 1,
    limit = 10,
    status,
    userId,
    matchId,
    startDate,
    endDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.PaymentWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  if (userId) {
    where.userId = userId;
  }

  if (matchId) {
    where.matchId = matchId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const orderBy: Prisma.PaymentOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [payments, totalPayments] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
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
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    totalPayments,
    totalPages: Math.ceil(totalPayments / limit),
    currentPage: page,
  };
}

// Refund Management Functions
export async function createRefund(
  paymentId: string,
  data: CreateRefundInput,
  adminId: string
) {
  try {
    // Validate refund eligibility first
    const eligibility = await validateRefundEligibility(paymentId);
    if (!eligibility.eligible) {
      throw new BadRequestError(`Refund not allowed: ${eligibility.reason}`);
    }

    if (eligibility.maxRefundable && data.amount > eligibility.maxRefundable) {
      throw new BadRequestError(
        `Refund amount exceeds maximum refundable amount of ${eligibility.maxRefundable}`
      );
    }

    // Process the refund
    const refundResult = await processPaymentRefund(paymentId, data, adminId);
    return refundResult;
  } catch (error: any) {
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    console.error("Error in createRefund:", error);
    throw new Error(
      "Refund processing temporarily disabled - pending Prisma regeneration"
    );
  }
}

export async function getPaymentById(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
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
      metadata: true,
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
          status: true,
          game: {
            select: {
              name: true,
            },
          },
          location: {
            select: {
              name: true,
              city: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Check refund eligibility
  const eligibility = await validateRefundEligibility(paymentId);

  return {
    ...payment,
    refundEligibility: eligibility,
  };
}

export async function getAllRefunds(params: GetRefundsQueryInput) {
  const {
    page = 1,
    limit = 10,
    userId,
    matchId,
    startDate,
    endDate,
    sortBy = "refundedAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.PaymentWhereInput = {
    status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] },
    refundedAt: { not: null },
  };

  if (userId) {
    where.userId = userId;
  }

  if (matchId) {
    where.matchId = matchId;
  }

  if (startDate || endDate) {
    where.refundedAt = {};
    if (startDate) where.refundedAt.gte = new Date(startDate);
    if (endDate) where.refundedAt.lte = new Date(endDate);
  }

  const orderBy: Prisma.PaymentOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [refunds, totalRefunds] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        stripePaymentId: true,
        amount: true,
        currency: true,
        status: true,
        refundAmount: true,
        refundReason: true,
        refundedAt: true,
        description: true,
        createdAt: true,
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
      },
    }),
    prisma.payment.count({ where }),
  ]);

  // Get refund analytics for the same period
  const analytics = await getRefundAnalytics(startDate, endDate);

  return {
    refunds,
    totalRefunds,
    totalPages: Math.ceil(totalRefunds / limit),
    currentPage: page,
    analytics,
  };
}

export async function processStripeRefund(
  stripePaymentId: string,
  amount: number,
  reason: string
) {
  // TODO: Implement Stripe refund processing
  // This function will:
  // 1. Call Stripe API to process refund
  // 2. Return refund confirmation
  throw new Error(
    "Stripe refund processing temporarily disabled - pending implementation"
  );
}

// Admin create match function - admin creates match but doesn't participate
export async function createAdminMatch(
  adminId: string,
  matchData: CreateAdminMatchInput
) {
  // Validate that the admin user exists
  const adminUser = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, role: true },
  });

  if (!adminUser) {
    throw new BadRequestError("Admin user not found");
  }

  if (adminUser.role !== "ADMIN") {
    throw new BadRequestError("User is not an admin");
  }

  // Validate that the game exists
  const game = await prisma.game.findUnique({
    where: { id: matchData.gameId },
    select: { id: true, name: true },
  });

  if (!game) {
    throw new BadRequestError("Game not found");
  }

  console.log("Creating match with admin:", adminUser.id);
  console.log("Game:", game.name);
  console.log("Match data:", matchData);

  // Step 1: Create Location first
  const createdLocation = await prisma.location.create({
    data: matchData.location,
  });

  console.log("Created location:", createdLocation.id);

  // Step 2: Create the match with admin as creator but not as participant
  const match = await prisma.match.create({
    data: {
      gameId: matchData.gameId,
      locationId: createdLocation.id,
      scheduledAt: matchData.scheduledAt,
      maxPlayers: matchData.maxPlayers,
      pricePerUser: matchData.pricePerUser,
      durationMins: matchData.durationMins,
      creatorId: adminId, // Admin is the creator
      status: "UPCOMING",
      // Note: No participants are added automatically
    },
    include: {
      game: true,
      location: true,
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return match;
}
