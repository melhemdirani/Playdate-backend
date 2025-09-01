import { PrismaClient, NoShowReasonType, GameLevel } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../../errors";
import {
  CreateMatchInput,
  matchSelection,
  GetMatchesQueryInput,
  GetRecommendedMatchesQueryInput,
} from "./matchSchema";
import { gameSelection } from "../game/gameSchema";
import { imageSelection } from "../variants/image/imageSchema";
import dayjs from "dayjs";
import { createNotification } from "../notification/notificationService";
import { calculateUserOverallRating } from "../rating/ratingService";
import { createMatchPaymentIntent } from "../../payment/stripe/stripeService";
import { levelToNumber } from "../user/usersService";
import { createMatchRequest } from "../matchRequest/matchRequestService";

const prisma = new PrismaClient();

// Utility function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

export const createMatch = async (
  data: CreateMatchInput,
  creatorId: string
) => {
  try {
    const {
      gameId,
      location,
      scheduledAt,
      maxPlayers,
      pricePerUser,
      durationMins,
      status,
    } = data;

    // Step 1: Create Location first
    const createdLocation = await prisma.location.create({
      data: location,
    });

    // Step 2: Create Match and connect location by ID
    const match = await prisma.match.create({
      data: {
        gameId,
        scheduledAt,
        maxPlayers,
        pricePerUser,
        durationMins,
        status,
        creatorId,
        locationId: createdLocation.id,
        participants: {
          create: {
            userId: creatorId,
            team: 1,
          },
        },
      },
      include: {
        game: true,
      },
    });

    // Fetch full match with participants and game
    const fullMatch = await prisma.match.findUnique({
      where: { id: match.id },
      include: {
        game: true,
        participants: {
          include: {
            user: {
              include: {
                games: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    // Send match created notification to the creator
    await createNotification({
      userId: creatorId,
      type: "match_created",
      data: {
        game: fullMatch?.game,
        match: fullMatch,
      },
      redirectLink: `/match-details/${match.id}`,
    });

    return match;
  } catch (error) {
    console.error("Error creating match:", error);
    throw new Error("Failed to create match.");
  }
};

export const createAdminMatch = async (
  data: CreateMatchInput,
  creatorId?: string
) => {
  try {
    const {
      gameId,
      location,
      scheduledAt,
      maxPlayers,
      pricePerUser,
      durationMins,
      status,
    } = data;

    // Step 1: Create Location first
    const createdLocation = await prisma.location.create({
      data: location,
    });

    // Step 2: Create Match without any participants (admin is creator but not participant)
    const match = await prisma.match.create({
      data: {
        gameId,
        scheduledAt,
        maxPlayers,
        pricePerUser,
        durationMins,
        status: status || "UPCOMING",
        locationId: createdLocation.id,
        creatorId: creatorId || null, // Use provided creator ID or null for legacy compatibility
      },
      include: {
        game: true,
        location: true,
      },
    });

    return match;
  } catch (error) {
    console.error("Error creating admin match:", error);
    throw new Error("Failed to create admin match.");
  }
};

// Create match from request approval - doesn't add requester as participant
export const createMatchFromRequest = async (
  data: CreateMatchInput,
  creatorId: string
) => {
  try {
    const {
      gameId,
      location,
      scheduledAt,
      maxPlayers,
      pricePerUser,
      durationMins,
      status,
    } = data;

    // Step 1: Create Location first
    const createdLocation = await prisma.location.create({
      data: location,
    });

    // Step 2: Create Match and connect location by ID (no participants added)
    const match = await prisma.match.create({
      data: {
        gameId,
        scheduledAt,
        maxPlayers,
        pricePerUser,
        durationMins,
        status,
        creatorId,
        locationId: createdLocation.id,
        // Note: No participants are automatically added
      },
      include: {
        game: true,
        location: true,
        participants: {
          include: {
            user: {
              include: {
                games: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return match;
  } catch (error) {
    console.error("Error creating match from request:", error);
    throw new Error("Failed to create match from request.");
  }
};

export const getMatches = async (query: GetMatchesQueryInput) => {
  try {
    const where: any = {};

    if (query.gameId) {
      where.gameId = query.gameId;
    }

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.status) {
      const statuses = query.status.split(",").map((s) => s.trim());
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }

    if (query.creatorId) {
      where.creatorId = query.creatorId;
    }

    // if (query.userId) {
    //   where.participants = {
    //     none: {
    //       userId: query.userId,
    //     },
    //   };
    // }
    if (query.userId) {
      where.participants = {
        some: {
          userId: query.userId,
        },
      };
    }

    const matches = await prisma.match.findMany({
      where,
      select: {
        ...matchSelection,
        results: {
          select: {
            userId: true,
            outcome: true,
          },
        },
        game: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const gameId = match.game.id;
        const creatorId = match.createdBy?.id;
        const { results, ...rest } = match;

        const creatorGame = match.createdBy?.games.find(
          (g) => g.game.id === gameId
        );

        const participantsWithRatings = await Promise.all(
          match.participants.map(async (participant) => {
            const userGame = participant.user.games.find(
              (g) => g.game.id === gameId
            );
            const isCreator = participant.userId === creatorId;

            const participantResult = results.find(
              (r) => r.userId === participant.userId
            );
            const overallRating = await calculateUserOverallRating(
              participant.userId
            );

            return {
              ...participant,
              isCreator,
              outcome: participantResult?.outcome ?? null,
              user: {
                ...participant.user,
                gameLevel: userGame?.level || null,
                overallRating,
              },
            };
          })
        );

        return {
          ...rest,
          creator: {
            ...match.createdBy,
            gameLevel: creatorGame?.level || null,
          },
          participants: participantsWithRatings,
        };
      })
    );

    return enrichedMatches;
  } catch (error) {
    console.error("Error fetching matches:", error);
    throw new Error("Failed to retrieve matches.");
  }
};

export const getRecommendedMatches = async (
  userId: string,
  query: GetRecommendedMatchesQueryInput
) => {
  try {
    const where: any = {
      scheduledAt: {
        gte: new Date(),
      },
      participants: {
        none: {
          userId: userId,
        },
      },
    };
    if (query.date) {
      where.date = query.date;
    }

    if (query.time) {
      where.time = query.time;
    }

    if (query.gender && query.gender !== "ANYONE") {
      where.createdBy = {
        gender: query.gender,
      };
    }

    if (query.gameId) {
      where.gameId = query.gameId;
    }

    let matches = await prisma.match.findMany({
      where,
      orderBy: query.sortBy ? { [query.sortBy]: "asc" } : undefined,
      select: {
        ...matchSelection,
        results: {
          select: {
            userId: true,
            outcome: true,
          },
        },
        pinnedMatches: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    // Apply geolocation filtering if provided
    if (query.longitude !== undefined && query.latitude !== undefined) {
      const longitude = query.longitude;
      const latitude = query.latitude;
      const radius = 10; // Fixed 10km radius

      matches = matches.filter((match) => {
        const matchLongitude = match.location.longitude;
        const matchLatitude = match.location.latitude;

        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          latitude,
          longitude,
          matchLatitude,
          matchLongitude
        );

        return distance <= radius;
      });
    }

    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const gameId = match.game.id;
        const creatorId = match.createdBy?.id;
        const { results, pinnedMatches, ...rest } = match;

        const creatorGame = match.createdBy?.games.find(
          (g) => g.game.id === gameId
        );

        const participantsWithRatings = await Promise.all(
          match.participants.map(async (participant) => {
            const userGame = participant.user.games.find(
              (g) => g.game.id === gameId
            );
            const isCreator = participant.userId === creatorId;

            const participantResult = results.find(
              (r) => r.userId === participant.userId
            );
            const overallRating = await calculateUserOverallRating(
              participant.userId
            );

            return {
              ...participant,
              isCreator,
              outcome: participantResult?.outcome ?? null,
              user: {
                ...participant.user,
                gameLevel: userGame?.level || null,
                overallRating,
              },
            };
          })
        );

        return {
          ...rest,
          creator: {
            ...match.createdBy,
            gameLevel: creatorGame?.level || null,
          },
          participants: participantsWithRatings,
          isPinned: pinnedMatches && pinnedMatches.length > 0,
        };
      })
    );

    return enrichedMatches;
  } catch (error: any) {
    console.error("Error fetching recommended matches:", error);
    throw new Error(`Failed to retrieve recommended matches: ${error.message}`);
  }
};

export const getMatchById = async (id: string) => {
  const match = await prisma.match.findUnique({
    where: { id },
    select: matchSelection,
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  const gameId = match.game.id;
  const creatorId = match.createdBy?.id;
  const { results, ...rest } = match;

  // const creatorGame = match.createdBy.games.find((g) => g.gameId === gameId);
  const creatorGame = match.createdBy?.games.find((g) => g.game.id === gameId);

  const participantsWithRatings = await Promise.all(
    match.participants.map(async (participant) => {
      const userGame = participant.user.games.find((g) => g.game.id === gameId);
      const isCreator = participant.userId === creatorId;

      const participantResult = results.find(
        (r) => r.userId === participant.userId
      );
      const overallRating = await calculateUserOverallRating(
        participant.userId
      );

      return {
        ...participant,
        isCreator,
        outcome: participantResult?.outcome ?? null,
        user: {
          ...participant.user,
          gameLevel: userGame?.level || null,
          overallRating,
        },
      };
    })
  );

  return {
    ...rest,
    creator: {
      ...match.createdBy,
      gameLevel: creatorGame?.level || null,
    },
    participants: participantsWithRatings,
  };
};
export const updateMatch = async (id: string, data: any) => {
  // Get the original match to compare changes
  const originalMatch = await prisma.match.findUnique({
    where: { id },
    include: {
      participants: true,
      game: true,
      location: true,
    },
  });

  if (!originalMatch) {
    throw new NotFoundError("Match not found");
  }

  const match = await prisma.match.update({
    where: { id },
    data,
    include: {
      participants: true,
      game: true,
      location: true,
    },
  });

  // Time change notifications are not implemented yet
  // TODO: Implement time change detection and notifications when needed

  // Check for location changes
  if (data.locationId && data.locationId !== originalMatch.locationId) {
    const newLocation = await prisma.location.findUnique({
      where: { id: data.locationId },
    });

    for (const participant of match.participants) {
      await createNotification({
        userId: participant.userId,
        type: "venue_change",
        data: {
          game: match.game,
          match: match,
          newLocation: newLocation?.name || "New Location",
        },
        redirectLink: `/match-details/${match.id}`,
      });
    }
  }

  return match;
};

export const deleteMatch = async (id: string) => {
  await prisma.match.delete({
    where: { id },
  });
};

export async function awardAchievement(
  userId: string,
  achievementName: string
) {
  let achievement = await prisma.achievement.findUnique({
    where: { name: achievementName },
  });

  if (!achievement) {
    console.log(`Achievement "${achievementName}" not found. Creating it now.`);
    achievement = await prisma.achievement.create({
      data: {
        name: achievementName,
        image: "", // Default empty image for newly created achievements
      },
    });
  }

  const existingUserAchievement = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
  });

  if (!existingUserAchievement) {
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
    });
    console.log(`User ${userId} awarded achievement: ${achievementName}`);
    // Achievement notifications are temporarily paused
    // await createNotification({
    //   userId,
    //   type: "achievement_unlocked",
    //   data: {
    //     achievement: {
    //       name: achievementName,
    //     },
    //   },
    // });
  } else {
    console.log(`User ${userId} already has achievement: ${achievementName}`);
  }
}

// export async function joinMatch(userId: string, matchId: string) {
//   const match = await prisma.match.findUnique({
//     where: { id: matchId },
//     include: { participants: true },
//   });

//   if (!match) throw new Error("Match not found");
//   if (match.participants.length >= match.maxPlayers)
//     throw new Error("Match is full");

//   const teamCounts = { 1: 0, 2: 0 };
//   for (const p of match.participants) {
//     if (p.team === 1) teamCounts[1]++;
//     if (p.team === 2) teamCounts[2]++;
//   }

//   const assignedTeam = teamCounts[1] <= teamCounts[2] ? 1 : 2;

//   await prisma.matchParticipant.create({
//     data: {
//       userId,
//       matchId,
//       team: assignedTeam,
//     },
//   });

//   // Check if user already has the "Joined First Game" achievement
//   const achievement = await prisma.achievement.findUnique({
//     where: { name: "Joined First Game" },
//   });

//   if (achievement) {
//     const alreadyAwarded = await prisma.userAchievement.findUnique({
//       where: {
//         userId_achievementId: {
//           userId,
//           achievementId: achievement.id,
//         },
//       },
//     });

//     if (!alreadyAwarded) {
//       await prisma.userAchievement.create({
//         data: {
//           userId,
//           achievementId: achievement.id,
//         },
//       });
//     }
//   }

//   return { team: assignedTeam, match };
// }
export async function joinMatch(userId: string, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true, game: true },
  });

  if (!match) throw new NotFoundError("Match not found");
  if (match.participants.length >= match.maxPlayers)
    throw new BadRequestError("Match is already full");

  // Get user's skill level for this game
  const joiningUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { games: true },
  });

  const joiningUserGame = joiningUser?.games.find(
    (g) => g.gameId === match.gameId
  );
  const joiningUserLevel = joiningUserGame
    ? levelToNumber(joiningUserGame.level)
    : 1;

  // Get all participants with their skill levels
  const participantsWithLevels = await Promise.all(
    match.participants.map(async (p) => {
      const user = await prisma.user.findUnique({
        where: { id: p.userId },
        include: { games: true },
      });
      const userGame = user?.games.find((g) => g.gameId === match.gameId);
      const userLevel = userGame ? levelToNumber(userGame.level) : 1;
      return { ...p, level: userLevel };
    })
  );

  // Calculate team skill totals
  const team1Participants = participantsWithLevels.filter((p) => p.team === 1);
  const team2Participants = participantsWithLevels.filter((p) => p.team === 2);

  const team1SkillTotal = team1Participants.reduce(
    (sum, p) => sum + p.level,
    0
  );
  const team2SkillTotal = team2Participants.reduce(
    (sum, p) => sum + p.level,
    0
  );

  // Assign to team that would result in better balance
  let assignedTeam: number;
  if (team1Participants.length === 0 && team2Participants.length === 0) {
    // First player always goes to team 1
    assignedTeam = 1;
  } else if (team1Participants.length === 0) {
    assignedTeam = 1;
  } else if (team2Participants.length === 0) {
    assignedTeam = 2;
  } else {
    // Calculate skill balance after adding new player to each team
    const team1NewTotal = team1SkillTotal + joiningUserLevel;
    const team2NewTotal = team2SkillTotal + joiningUserLevel;

    // Calculate skill difference for each scenario
    const team1Diff = Math.abs(team1NewTotal - team2SkillTotal);
    const team2Diff = Math.abs(team1SkillTotal - team2NewTotal);

    // Also consider team size balance
    const team1SizeDiff = Math.abs(
      team1Participants.length + 1 - team2Participants.length
    );
    const team2SizeDiff = Math.abs(
      team1Participants.length - (team2Participants.length + 1)
    );

    // Weighted decision: prioritize skill balance but also consider team size
    const team1Score = team1Diff + team1SizeDiff * 0.5;
    const team2Score = team2Diff + team2SizeDiff * 0.5;

    assignedTeam = team1Score <= team2Score ? 1 : 2;
  }

  const participant = await prisma.matchParticipant.create({
    data: {
      userId,
      matchId,
      team: assignedTeam,
      status: "PENDING_PAYMENT",
    },
  });

  console.log(`[joinMatch] User ${userId} joined match ${matchId}.`);

  // 🏆 Handle "Joined First Game" Achievement
  const totalJoinedMatches = await prisma.matchParticipant.count({
    where: { userId },
  });
  console.log(
    `[joinMatch] User ${userId} has joined ${totalJoinedMatches} matches.`
  );

  console.log(
    `[joinMatch] Attempting to award "Joined First Game" to user ${userId}.`
  );
  // TODO: move this to payment succeeeded:

  await awardAchievement(userId, "Joined First Game");
  const session = await createMatchPaymentIntent({
    userId,
    matchId,
    entryFee: match.pricePerUser,
  });

  // Notify the user who joined
  // Fetch full match with participants and game
  const fullMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      game: true,
      participants: {
        include: {
          user: {
            include: {
              games: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });
  await createNotification({
    userId,
    type: "match_joined",
    data: {
      game: fullMatch?.game,
      match: fullMatch,
    },
  });

  // Notify the match creator and other participants
  const otherParticipants = match.participants.filter(
    (p) => p.userId !== userId
  );
  for (const participant of otherParticipants) {
    await createNotification({
      userId: participant.userId,
      type: "player_joined_match",
      data: {
        game: fullMatch?.game,
        match: fullMatch,
      },
    });
  }

  // If match is now full, notify all participants
  const updatedMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      game: true,
      participants: {
        include: {
          user: {
            include: {
              games: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });
  if (
    updatedMatch &&
    updatedMatch.participants.length === updatedMatch.maxPlayers
  ) {
    // Calculate team size string (e.g., 2v2)
    const teamCounts: Record<number, number> = {};
    for (const p of updatedMatch.participants) {
      if (typeof p.team === "number") {
        teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
      }
    }
    const teams = Object.values(teamCounts);
    let teamSizeStr = "";
    if (teams.length === 2) {
      teamSizeStr = `${teams[0]}v${teams[1]}`;
    } else if (teams.length === 1) {
      teamSizeStr = `${teams[0]} players`;
    } else {
      teamSizeStr = `${updatedMatch.maxPlayers} players`;
    }
    const gameName = updatedMatch.game?.name
      ? updatedMatch.game.name.charAt(0).toUpperCase() +
        updatedMatch.game.name.slice(1)
      : "Game";
    const customTitle = `${teamSizeStr} ${gameName} is full now`;
    for (const participant of updatedMatch.participants) {
      await createNotification({
        userId: participant.userId,
        type: "match_full",
        title: customTitle,
        redirectLink: `/match-details/${updatedMatch.id}`,
        data: {
          game: updatedMatch.game,
          match: updatedMatch,
        },
      });
    }
  }

  return { team: assignedTeam, match, clientSecret: session.clientSecret };
}

type ReportMatchResultInput = {
  matchId: string;
  userId: string;
  outcome: MatchOutcome;
  ratings?: { [ratedId: string]: { rating: number; comment?: string } };
};
// Report match result - uncommented and enhanced with notifications
export const reportMatchResult = async ({
  matchId,
  userId,
  outcome,
  ratings,
}: ReportMatchResultInput) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: true,
      game: true,
      results: true,
    },
  });

  if (!match) throw new NotFoundError("Match not found");

  const isParticipant = match.participants.some((p) => p.userId === userId);
  if (!isParticipant) throw new BadRequestError("User is not a participant");

  const existingResult = await prisma.matchResult.findFirst({
    where: { matchId, userId },
  });
  if (existingResult) throw new BadRequestError("Result already submitted");

  const result = await prisma.matchResult.create({
    data: {
      matchId,
      userId,
      outcome,
      reportedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      gamesPlayed: { increment: 1 },
    },
  });

  // Save ratings
  if (ratings) {
    const ratingData = Object.entries(ratings).map(([ratedId, rating]) => ({
      matchId,
      raterId: userId,
      ratedId,
      rating: rating.rating,
      comment: rating.comment,
    }));

    await prisma.rating.createMany({ data: ratingData });
  }

  // Check if all participants have now submitted their results
  const allResults = await prisma.matchResult.findMany({
    where: { matchId },
    include: { user: true },
  });

  const totalParticipants = match.participants.length;
  const submittedResults = allResults.length;

  // If all players have submitted results, notify everyone
  if (submittedResults === totalParticipants) {
    for (const participant of match.participants) {
      await createNotification({
        userId: participant.userId,
        type: "match_result_reported",
        redirectLink: `/match-details/${matchId}/results`,
        data: {
          match,
          game: match.game,
          gameType: match.game.name,
          totalResults: submittedResults,
        },
      });
    }
  }

  // Achievement for winning
  if (outcome === "WON") {
    const achievement = await prisma.achievement.findUnique({
      where: { name: "Won First Match" },
    });

    if (achievement) {
      const hasAchievement = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
      });

      if (!hasAchievement) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });
      }
    }
  }

  return result;
};

// Promote user to next level
function promoteLevel(level: GameLevel): GameLevel {
  if (level === "BEGINNER") return "INTERMEDIATE";
  if (level === "INTERMEDIATE") return "PROFESSIONAL";
  return "PROFESSIONAL";
}

// Demote user to previous level
function demoteLevel(level: GameLevel): GameLevel {
  if (level === "PROFESSIONAL") return "INTERMEDIATE";
  if (level === "INTERMEDIATE") return "BEGINNER";
  return "BEGINNER";
}

type MatchOutcome = "WON" | "LOST" | "DRAW" | "NO_SHOW" | "DISPUTED";
interface AdjustScoreInput {
  outcome: "WON" | "LOST" | "DRAW";
  userLevel: GameLevel;
  opponentLevel: GameLevel;
  currentScore: number;
}

interface AdjustScoreResult {
  newLevel: GameLevel;
  newScore: number;
  wasPromoted: boolean;
  wasDemoted: boolean;
}

export function adjustScore({
  outcome,
  userLevel,
  opponentLevel,
  currentScore,
}: AdjustScoreInput): AdjustScoreResult {
  const userRank = levelToNumber(userLevel);
  const opponentRank = levelToNumber(opponentLevel);
  const levelDiff = opponentRank - userRank;

  let delta = 0;

  // Determine delta based on outcome and relative level difference
  switch (outcome) {
    case "WON":
      delta = levelDiff === 0 ? 2 : levelDiff < 0 ? 1 : 3;
      break;
    case "LOST":
      delta = levelDiff === 0 ? -2 : levelDiff < 0 ? -3 : 0;
      break;
    case "DRAW":
      delta = levelDiff === 0 ? 0 : levelDiff < 0 ? -1 : 1;
      break;
  }
  // TODO: limit weekly points gain/loss
  // TODO: Deduct points monthly if didnt play any matches

  delta = Math.max(Math.min(delta, 5), -5); // limit between -5 and +5
  let newScore = currentScore + delta;

  let wasPromoted = false;
  let wasDemoted = false;
  let newLevel = userLevel;

  // Handle promotion
  if (newScore >= 100 && userLevel !== "PROFESSIONAL") {
    newLevel = promoteLevel(userLevel);
    newScore = newScore - 100;
    wasPromoted = true;
  }

  // Handle demotion
  if (newScore < 0 && userLevel !== "BEGINNER") {
    newLevel = demoteLevel(userLevel);
    newScore = 100 + newScore; // newScore is negative here
    wasDemoted = true;
  }

  // Keep score within 0–999
  newScore = Math.max(0, Math.min(newScore, 999));

  return { newLevel, newScore, wasPromoted, wasDemoted };
}
export const updateMatchOutcome = async (
  matchId: string,
  userId: string,
  outcome: MatchOutcome
) => {
  // 1. Fetch match with participants and existing results
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: true,
      results: true,
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  // 2. Check user is participant
  const isParticipant = match.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw new BadRequestError("User is not a participant in this match");
  }

  // 3. Check if user has already voted - PREVENT DUPLICATE VOTING
  const existingUserResult = match.results.find((r) => r.userId === userId);
  if (existingUserResult) {
    throw new BadRequestError(
      "You have already submitted your outcome for this match"
    );
  }

  // 4. Prepare outcomes for all participants
  // For DRAW, everyone gets DRAW
  // For WON or LOST, userId gets given outcome, others get opposite
  const otherOutcome =
    outcome === "WON" ? "LOST" : outcome === "LOST" ? "WON" : "DRAW";

  // 5. For each participant, create their MatchResult with proper outcome
  for (const participant of match.participants) {
    const currentOutcome =
      participant.userId === userId ? outcome : otherOutcome;

    // Only create new results, don't update existing ones
    const hasExistingResult = match.results.find(
      (r) => r.userId === participant.userId
    );

    if (!hasExistingResult) {
      await prisma.matchResult.create({
        data: {
          matchId,
          userId: participant.userId,
          outcome: currentOutcome,
          reportedAt: new Date(),
        },
      });

      // Check for "Won First Match" achievement
      if (currentOutcome === "WON") {
        const wonMatchesCount = await prisma.matchResult.count({
          where: {
            userId: participant.userId,
            outcome: "WON",
          },
        });

        if (wonMatchesCount === 1) {
          await awardAchievement(participant.userId, "Won First Match");
        }
      }
    }
  }

  // 6. Return updated match with results included
  const updatedMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      results: {
        include: {
          user: true,
        },
      },
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  return updatedMatch;
};

// cron funcs

export const reportNoShow = async (
  matchId: string,
  reporterId: string,
  reportedUserId: string,
  reporterComment?: string
) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: true,
      game: true,
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  const isReporterParticipant = match.participants.some(
    (p) => p.userId === reporterId
  );
  if (!isReporterParticipant) {
    throw new BadRequestError("Reporter is not a participant in this match");
  }

  const isReportedUserParticipant = match.participants.some(
    (p) => p.userId === reportedUserId
  );
  if (!isReportedUserParticipant) {
    throw new BadRequestError(
      "Reported user is not a participant in this match"
    );
  }

  // Allow multiple reports from same reporter - removed duplicate check
  const report = await prisma.noShowReport.create({
    data: {
      matchId,
      reporterId,
      reportedUserId,
      reporterComment,
    },
  });

  // Send notification to reported user every time they get reported
  await createNotification({
    userId: reportedUserId,
    type: "player_reported_you",
    redirectLink: `/reported?matchId=${matchId}&noShowReportId=${report.id}`,
    data: {
      match,
      reporterId,
      gameType: match.game.name,
      time: match.scheduledAt,
    },
  });

  // Send confirmation to the reporter that their report was submitted
  await createNotification({
    userId: reporterId,
    type: "no_show_reported",
    data: {
      match,
      gameType: match.game.name,
      noShowUserId: reportedUserId,
    },
    // redirectLink: `/match-details/${matchId}`,
  });

  // Notify other participants about the teammate no-show
  for (const participant of match.participants) {
    if (
      participant.userId !== reportedUserId &&
      participant.userId !== reporterId
    ) {
      await createNotification({
        userId: participant.userId,
        type: "teammate_no_show",
        data: {
          match,
          gameType: match.game.name,
          noShowUserId: reportedUserId,
        },
        redirectLink: `/match-details/${matchId}`,
      });
    }
  }

  return report;
};

export const submitNoShowReason = async (
  noShowReportId: string,
  userId: string,
  reason: NoShowReasonType,
  customReason?: string
) => {
  const noShowReport = await prisma.noShowReport.findUnique({
    where: { id: noShowReportId },
  });

  if (!noShowReport) {
    throw new NotFoundError("No-show report not found.");
  }

  if (noShowReport.reportedUserId !== userId) {
    throw new BadRequestError(
      "You are not authorized to submit a reason for this report."
    );
  }

  if (noShowReport.reason) {
    throw new BadRequestError(
      "Reason for this no-show report has already been submitted."
    );
  }

  const finalReason = reason === NoShowReasonType.OTHER ? customReason : reason;

  const updatedReport = await prisma.noShowReport.update({
    where: { id: noShowReportId },
    data: {
      reason: reason,
      customReason: customReason,
    },
  });

  return updatedReport;
};

export const rescheduleMatch = async (
  matchId: string,
  newDate: string,
  newTime: string,
  requestingUserId: string
) => {
  const originalMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: true,
      game: true,
      location: true,
      results: true,
    },
  });

  if (!originalMatch) {
    throw new NotFoundError("Original match not found.");
  }

  const isParticipant = originalMatch.participants.some(
    (p) => p.userId === requestingUserId
  );

  if (!isParticipant) {
    throw new BadRequestError(
      "Only a participant of the match can reschedule it."
    );
  }

  if (originalMatch.status !== "COMPLETED") {
    throw new BadRequestError("Only completed matches can be rescheduled.");
  }

  // Create a match request instead of directly creating a match
  const matchRequest = await createMatchRequest(
    {
      gameId: originalMatch.gameId,
      location: {
        name: originalMatch.location.name || "",
        longitude: originalMatch.location.longitude,
        latitude: originalMatch.location.latitude,
        city: originalMatch.location.city || "",
        country: originalMatch.location.country || "",
      },
      scheduledAt: `${newDate}T${newTime}:00Z`,
      maxPlayers: originalMatch.maxPlayers,
      durationMins: originalMatch.durationMins || 60,
    },
    requestingUserId
  );

  // Store the original participants for when the request gets approved
  // We'll need to modify the approval process to handle this
  await prisma.matchRequest.update({
    where: { id: matchRequest.id },
    data: {
      // Store original match participants in a custom field or handle separately
      // For now, let's add the original match ID as reference
      adminNote: `Rescheduled from match ${
        originalMatch.id
      }. Original participants: ${originalMatch.participants
        .map((p) => p.userId)
        .join(", ")}`,
    },
  });

  return { originalMatch, matchRequest };
};

export const updateMatchStatuses = async () => {
  const now = new Date();
  // TODO: add batches to avoid locking issues
  try {
    // ✅ 1. Start matches when scheduledAt <= now and status is UPCOMING
    const matchesToStart = await prisma.match.findMany({
      where: {
        status: "UPCOMING",
        scheduledAt: {
          lte: now,
        },
      },
      include: {
        game: {
          select: {
            id: true,
            name: true,
          },
        },
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const match of matchesToStart) {
      // Update match status to ONGOING
      await prisma.match.update({
        where: { id: match.id },
        data: { status: "ONGOING" },
      });

      // Send match_started notifications to all participants
      for (const participant of match.participants) {
        await createNotification({
          userId: participant.userId,
          type: "match_started",
          redirectLink: `/match-details/${match.id}`,
          data: {
            match,
            game: match.game,
            gameType: match.game.name,
          },
        });
      }
    }

    // ✅ 2. Complete matches whose scheduledAt + durationMins < now and status is ONGOING
    const matchesToComplete = await prisma.match.findMany({
      where: {
        status: "ONGOING",
        scheduledAt: {
          lte: dayjs(now).subtract(5, "minute").toDate(), // small buffer
        },
      },
      include: {
        participants: true,
      },
    });

    for (const match of matchesToComplete) {
      const endTime = dayjs(match.scheduledAt).add(
        match.durationMins,
        "minute"
      );
      if (dayjs(now).isAfter(endTime)) {
        const participantIds = match.participants.map((p) => p.userId);

        // ✅ Update match status to COMPLETED
        const updatedMatch = await prisma.match.update({
          where: { id: match.id },
          data: { status: "COMPLETED" },
          include: {
            game: {
              select: {
                id: true,
                name: true,
                image: {
                  select: {
                    url: true,
                    publicId: true,
                    fileName: true,
                  },
                },
              },
            },
            participants: {
              include: {
                user: {
                  include: {
                    games: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        });

        // ✅ Send completion and submit results notifications to all participants
        for (const participant of updatedMatch.participants) {
          // Send match completed notification
          await createNotification({
            userId: participant.userId,
            type: "match_completed",
            redirectLink: `/calendar`,
            data: {
              game: updatedMatch.game,
              match: updatedMatch,
            },
          });

          // Send submit results notification
          await createNotification({
            userId: participant.userId,
            type: "submit_game_results",
            redirectLink: `/match-report-outcome?matchId=${updatedMatch.id}`,
            data: {
              game: updatedMatch.game,
              match: updatedMatch,
              time: updatedMatch.scheduledAt,
            },
          });
        }

        // ✅ Increment gamesPlayed for each participant
        await prisma.user.updateMany({
          where: {
            id: { in: participantIds },
          },
          data: {
            gamesPlayed: { increment: 1 },
          },
        });
      }
    }

    console.log("Cron job: Match statuses updated.");
  } catch (err) {
    console.error("Cron job error:", err);
  }
};

export const cancelMatch = async (
  matchId: string,
  userId: string,
  cancellationReason: string,
  customCancellationReason?: string,
  userRole?: string
) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: {
        include: {
          user: {
            include: {
              games: true,
              profileImage: true,
            },
          },
        },
      },
      game: true,
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  // Allow match creator or admin to cancel the match
  if (match.creatorId !== userId && userRole !== "ADMIN") {
    throw new BadRequestError("Only the creator or admin can cancel the match");
  }

  if (cancellationReason === "OTHER" && !customCancellationReason) {
    throw new BadRequestError(
      'Custom cancellation reason is required when reason is "OTHER"'
    );
  }

  const reason =
    cancellationReason === "OTHER"
      ? `Other - ${customCancellationReason}`
      : cancellationReason;

  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "CANCELLED",
      cancellationReason: reason,
    },
  });

  const scheduledDate = new Date(match.scheduledAt);
  const timeString = scheduledDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const gameType = match.game?.name
    ? match.game.name.charAt(0).toUpperCase() + match.game.name.slice(1)
    : "Game";
  const title = `Heads up! Your ${gameType} at\n${timeString} just got canceled`;

  for (const participant of match.participants) {
    // Determine notification type based on cancellation reason
    let notificationType:
      | "match_cancelled"
      | "game_cancelled_low_attendance"
      | "admin_cancelled_booking" = "match_cancelled";

    if (
      reason.includes("low attendance") ||
      reason.includes("LOW_ATTENDANCE")
    ) {
      notificationType = "game_cancelled_low_attendance";
    } else if (reason.includes("admin") || reason.includes("ADMIN")) {
      notificationType = "admin_cancelled_booking";
    }

    await createNotification({
      userId: participant.userId,
      type: notificationType,
      title,
      // redirectLink: `/matches`,
      data: {
        matchId: match.id,
        game: match.game,
        scheduledAt: match.scheduledAt,
        location: match.locationId,
        cancellationReason: reason,
        participants: match.participants.map((p) => ({
          userId: p.userId,
          name: p.user.name,
          email: p.user.email,
          phoneNumber: p.user.phoneNumber,
          profileImage: p.user.profileImage,
          games: p.user.games,
        })),
      },
    });
  }

  return updatedMatch;
};

export const leaveMatch = async (
  matchId: string,
  userId: string,
  leaveReason: string,
  customLeaveReason?: string
) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: { include: { user: true } },
      game: true,
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  if (leaveReason === "OTHER" && !customLeaveReason) {
    throw new BadRequestError(
      "Custom leave reason is required when leave reason is 'OTHER'"
    );
  }

  const participant = match.participants.find((p) => p.userId === userId);

  if (!participant) {
    throw new BadRequestError("User is not a participant in this match");
  }

  // Update the match to store the leave reason if needed (similar to cancellation reason)
  // For now, we'll just remove the participant and send notifications

  await prisma.matchParticipant.delete({
    where: {
      userId_matchId: {
        userId,
        matchId,
      },
    },
  });

  const leavingUser = await prisma.user.findUnique({ where: { id: userId } });

  // Check if match is more than 12 hours away
  const matchTime = new Date(match.scheduledAt);
  const currentTime = new Date();
  const hoursUntilMatch =
    (matchTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

  // Send appropriate cancellation notification based on timing
  if (hoursUntilMatch > 12) {
    // More than 12 hours - refund available
    await createNotification({
      userId,
      type: "you_cancelled_spot",
      data: {
        game: match.game,
        match: match,
        gameType: match.game?.name,
        date: match.scheduledAt,
      },
    });
  } else {
    // Less than 12 hours - no refund
    await createNotification({
      userId,
      type: "you_cancelled_spot_no_refund",
      data: {
        game: match.game,
        match: match,
        gameType: match.game?.name,
        date: match.scheduledAt,
      },
    });
  }

  for (const p of match.participants) {
    if (p.userId !== userId) {
      await createNotification({
        userId: p.userId,
        type: "player_left_match",
        // redirectLink: `/matches/${match.id}`,
      });
    }
  }
};

export const submitPlayerRatings = async (
  matchId: string,
  userId: string,
  ratings: { [ratedId: string]: { rating: number; comment?: string } }
) => {
  // 1. Verify match exists and user is a participant
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: true,
      results: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  const isParticipant = match.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw new BadRequestError("User is not a participant in this match");
  }

  // Validate that all rated users are participants in the match
  if (ratings && Object.keys(ratings).length > 0) {
    const participantIds = match.participants.map((p) => p.userId);
    const invalidRatedIds = Object.keys(ratings).filter(
      (ratedId) => !participantIds.includes(ratedId)
    );

    if (invalidRatedIds.length > 0) {
      throw new BadRequestError(
        `Cannot rate users who are not participants in this match: ${invalidRatedIds.join(
          ", "
        )}`
      );
    }
  }

  // 2. Save ratings
  if (ratings && Object.keys(ratings).length > 0) {
    // Check if any ratings already exist for this user and match
    const existingRatings = await prisma.rating.findMany({
      where: {
        matchId,
        raterId: userId,
        ratedId: { in: Object.keys(ratings) },
      },
    });

    if (existingRatings.length > 0) {
      const existingRatedIds = existingRatings.map((r) => r.ratedId);
      throw new BadRequestError(
        `You have already rated players: ${existingRatedIds.join(
          ", "
        )} for this match`
      );
    }

    const ratingData = Object.entries(ratings).map(
      ([ratedId, ratingObject]) => ({
        matchId,
        raterId: userId,
        ratedId,
        rating: ratingObject.rating,
        comment: ratingObject.comment,
      })
    );

    try {
      await prisma.rating.createMany({ data: ratingData });
    } catch (dbError: any) {
      if (dbError.code === "P2002") {
        throw new BadRequestError(
          "You have already rated one or more of these players for this match"
        );
      }
      throw dbError;
    }

    // 3. Send notification to each rated player (non-blocking)
    setImmediate(async () => {
      // Get rater and match info for enhanced notifications
      const rater = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          game: {
            select: { name: true },
          },
        },
      });

      Promise.all(
        Object.entries(ratings).map(([ratedId, ratingData]) =>
          createNotification({
            userId: ratedId,
            type: "player_rated_you",
            data: {
              gameType: match?.game?.name,
              playerName: rater?.name,
              rating: ratingData.rating,
              matchId,
              raterId: userId,
            },
          }).catch((error) => {
            console.error(`Failed to send notification to ${ratedId}:`, error);
          })
        )
      );
    });
  }

  // 4. Return updated match with results included (same format as outcome route)
  const updatedMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      results: {
        include: {
          user: true,
        },
      },
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  return updatedMatch;
};

// Report user behavior
// Report user behavior
export const reportUserBehavior = async (
  reporterId: string,
  reportedUserId: string,
  matchId: string,
  reason: string,
  description?: string
) => {
  // Verify both users are participants in the match
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: true,
      game: true,
    },
  });

  if (!match) {
    throw new BadRequestError("Match not found");
  }

  const isReporterParticipant = match.participants.some(
    (p) => p.userId === reporterId
  );
  const isReportedParticipant = match.participants.some(
    (p) => p.userId === reportedUserId
  );

  if (!isReporterParticipant) {
    throw new BadRequestError("You are not a participant in this match");
  }

  if (!isReportedParticipant) {
    throw new BadRequestError(
      "Reported user is not a participant in this match"
    );
  }

  if (reporterId === reportedUserId) {
    throw new BadRequestError("You cannot report yourself");
  }

  // Check if already reported this user for this match
  const existingReport = await prisma.userReport.findFirst({
    where: {
      reporterId,
      reportedId: reportedUserId,
      // Note: UserReport model doesn't have matchId, so we check if recent report exists
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // within last 24 hours
      },
    },
  });

  if (existingReport) {
    throw new BadRequestError("You have already reported this user recently");
  }

  // Create the report
  const report = await prisma.userReport.create({
    data: {
      reporterId,
      reportedId: reportedUserId,
      reason: reason as any, // UserReportReason enum
      description,
    },
  });

  // Send notification to reported user
  await createNotification({
    userId: reportedUserId,
    type: "player_reported_you",
    data: {
      match,
      reporterId,
      reason,
      gameType: match.game.name,
    },
  });

  return report;
};
