// Types and Imports
import { GameLevel, Location, PreferredTime, SkillLevel } from "@prisma/client";
import { prisma } from "../../db/db";
import { GetMatchesQueryInput } from "./matchSchema";

// Minimal MatchParticipant user structure needed for level comparison
type MatchParticipant = {
  user: {
    games: {
      gameId: string;
      level: GameLevel;
    }[];
  };
};

// Minimal User type for rarity boost
type User = {
  games: {
    gameId: string;
  }[];
  gamesPlayed?: number;
};

// Main function to retrieve and score matches for a user
export const getMatches = async (query: GetMatchesQueryInput) => {
  try {
    // Ensure userId is provided
    if (!query.userId) throw new Error("User ID is required");

    // Load user preferences and joined/created match history
    const user = await prisma.user.findUnique({
      where: { id: query.userId },
      include: {
        games: true,
        locations: true,
        joinedMatches: true,
        createdMatches: true,
      },
    });

    if (!user) throw new Error("User not found");

    // Prepare user data
    const preferredGameIds = user.games.map((g) => g.gameId);
    const preferredTimes = user.preferredTimes;
    const userSkillMap = new Map(user.games.map((g) => [g.gameId, g.level]));
    const userLocation = user.locations[0];
    const joinedMatchIds = new Set(user.joinedMatches.map((j) => j.matchId));
    const createdMatchesIds = new Set(user.createdMatches.map((c) => c.id));

    // Fetch eligible matches that are upcoming and not joined or created by user
    const matches = await prisma.match.findMany({
      where: {
        status: "UPCOMING",
        scheduledAt: { gte: new Date() },
        participants: { none: { userId: query.userId } },
        gameId: { in: preferredGameIds },
        id: { notIn: [...joinedMatchIds, ...createdMatchesIds] },
      },
      include: {
        participants: {
          include: {
            user: { include: { games: true } },
          },
        },
        location: true,
        game: true,
        createdBy: true,
        results: true,
      },
    });

    // Score and enrich matches
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const maxPlayers = match.maxPlayers;
        const participantCount = match.participants.length;
        const fillRate = participantCount / maxPlayers;

        const gameId = match.game.id;
        const gameName = match.game.name.toLowerCase();

        // Determine if the game is team-based (affects how we score level matching)
        const isTeamGame =
          ["basketball", "volleyball"].includes(gameName) ||
          (["padel", "tennis"].includes(gameName) && maxPlayers > 2);

        // Skill level comparison (max 50 for individual, max 30 for team games)
        const userLevel = userSkillMap.get(gameId);
        const teamAverageLevel = averageTeamLevel(match.participants, gameId);
        const levelScore = getLevelScore(
          isTeamGame,
          userLevel,
          teamAverageLevel
        );

        // % filled scoring (max 50):
        // 50 if more than 50% filled, 25 if less, 0 if full
        const fillScore = fillRate >= 1 ? 0 : fillRate >= 0.5 ? 50 : 25;

        // Location score (max 25) — closer than 3km: 25, within 10km: 15, else 0
        const locationScore = getLocationScore(match.location, userLocation);

        // Time preference score (max 10) — exact match with preferred time range
        const timeScore = getTimeScore(match.scheduledAt, preferredTimes);

        // Game rarity boost (max 10) — based on game priority, not count
        const rarityScore = getGameRarityBoost(user, match.game.name);

        // Final relevance score (max 145 total)
        const finalScore =
          fillScore + levelScore + locationScore + timeScore + rarityScore;

        return {
          ...match,
          score: finalScore,
          fillRate,
        };
      })
    );

    // Sort by total score descending
    enrichedMatches.sort((a, b) => b.score - a.score);

    // Always return 3 matches that exactly match user preferences if available
    const exactMatches = enrichedMatches
      .filter((m) => {
        const userLevel = userSkillMap.get(m.game.id);
        const teamLevel = averageTeamLevel(m.participants, m.game.id);
        return (
          m.fillRate < 0.3 &&
          getLevelScore(false, userLevel, teamLevel) === 50 &&
          getLocationScore(m.location, userLocation) === 25 &&
          getTimeScore(m.scheduledAt, preferredTimes) === 10
        );
      })
      .slice(0, 3);

    const restMatches = enrichedMatches.filter(
      (m) => !exactMatches.includes(m)
    );

    // Return preferred exact matches first, followed by the rest
    return [...exactMatches, ...restMatches];
  } catch (error) {
    console.error("Error fetching matches:", error);
    throw new Error("Failed to retrieve matches.");
  }
};

// Game rarity score based on priority list (squash > basketball > volleyball > tennis > padel)
function getGameRarityBoost(user: User, gameName: string): number {
  const priority: Record<string, number> = {
    squash: 10,
    basketball: 8,
    volleyball: 6,
    tennis: 4,
    padel: 2,
  };

  const name = gameName.toLowerCase();
  return priority[name] || 0;
}

// Converts skill level enum to numeric value
function skillLevelToNumber(level?: GameLevel | SkillLevel): number {
  switch (level) {
    case "BEGINNER":
      return 1;
    case "INTERMEDIATE":
      return 2;
    case "PROFESSIONAL":
    case "ADVANCED":
    case "EXPERT":
      return 3;
    default:
      return 0;
  }
}

// Calculates average skill level of all participants in a match for a specific game
function averageTeamLevel(
  participants: MatchParticipant[],
  gameId: string
): number {
  const levels = participants
    .map((p) => p.user.games.find((g) => g.gameId === gameId)?.level)
    .filter(Boolean)
    .map(skillLevelToNumber);
  return levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
}

// Assigns a level compatibility score based on difference and game type
function getLevelScore(
  isTeamGame: boolean,
  userLevel?: GameLevel,
  avgLevel?: number
): number {
  const userNum = skillLevelToNumber(userLevel);
  if (!userNum || !avgLevel) return 0;
  const diff = Math.abs(userNum - avgLevel);
  return isTeamGame
    ? diff === 0
      ? 30
      : diff === 1
      ? 15
      : 0
    : diff === 0
    ? 50
    : diff === 1
    ? 25
    : 0;
}

// Calculates distance between user and match location and assigns score
function getLocationScore(matchLoc: Location, userLoc?: Location): number {
  if (!matchLoc || !userLoc) return 0;
  const dist = haversineDistance(
    matchLoc.latitude,
    matchLoc.longitude,
    userLoc.latitude,
    userLoc.longitude
  );
  return dist <= 3 ? 25 : dist <= 10 ? 15 : 0;
}

// Assigns score if match time aligns with user's preferred time slots
function getTimeScore(scheduledAt: Date, preferred: PreferredTime[]): number {
  const hour = scheduledAt.getHours();
  const timeMatch = preferred.some((p) => {
    if (p === "ANYTIME") return true;
    if (p === "MORNING") return hour >= 6 && hour < 10;
    if (p === "AFTERNOON") return hour >= 10 && hour < 16;
    if (p === "LATE_NIGHT") return hour >= 21 && hour <= 23;
    return false;
  });
  return timeMatch ? 10 : 0;
}

// Haversine formula for calculating geographical distance between coordinates
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Converts degrees to radians
function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
