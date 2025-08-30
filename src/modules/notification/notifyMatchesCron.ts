import { PrismaClient } from "@prisma/client";
import { createNotification } from "./notificationService";
import { notificationsData } from "./data";

const prisma = new PrismaClient();

// Notify users about matches starting soon (2 hours and 30 minutes before)
export async function notifyUpcomingMatches(batchSize = 100) {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

  // Find matches starting in 2 hours, not completed/cancelled
  const matchesInTwoHours = await prisma.match.findMany({
    where: {
      scheduledAt: {
        gte: twoHoursLater,
        lt: new Date(twoHoursLater.getTime() + 60 * 1000), // 1 minute window
      },
      status: {
        in: ["UPCOMING", "ONGOING"],
      },
    },
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
      location: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  for (const match of matchesInTwoHours) {
    // Check if this match is missing players and notify creator
    const missingPlayers = match.maxPlayers - match.participants.length;
    if (missingPlayers > 0 && match.creatorId) {
      await createNotification({
        userId: match.creatorId,
        type: "missing_player_alert",
        data: {
          game: match.game,
          match: match,
          gameType: match.game.name,
          missingPlayers: missingPlayers.toString(),
        },
        redirectLink: `/match-details/${match.id}`,
      });
    }

    // Send 2-hour reminders to all participants
    for (let i = 0; i < match.participants.length; i += batchSize) {
      const batch = match.participants.slice(i, i + batchSize);
      await Promise.all(
        batch.map((participant) =>
          createNotification({
            userId: participant.userId,
            type: "match_reminder_2_hours",
            redirectLink: `/match-details/${match.id}`,
            data: {
              game: match.game,
              match,
              gameType: match.game.name,
              location: match.location?.name,
              time: match.scheduledAt
                ? new Date(match.scheduledAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : undefined,
            },
          })
        )
      );
    }
  }

  // Find matches starting in 30 minutes, not completed/cancelled
  const matchesInThirtyMinutes = await prisma.match.findMany({
    where: {
      scheduledAt: {
        gte: thirtyMinutesLater,
        lt: new Date(thirtyMinutesLater.getTime() + 60 * 1000), // 1 minute window
      },
      status: {
        in: ["UPCOMING", "ONGOING"],
      },
    },
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
      location: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  for (const match of matchesInThirtyMinutes) {
    for (let i = 0; i < match.participants.length; i += batchSize) {
      const batch = match.participants.slice(i, i + batchSize);
      await Promise.all(
        batch.map((participant) =>
          createNotification({
            userId: participant.userId,
            type: "match_reminder_30_min",
            redirectLink: `/match-details/${match.id}`,
            data: {
              game: match.game,
              match,
              gameType: match.game.name,
              time: match.scheduledAt
                ? new Date(match.scheduledAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : undefined,
            },
          })
        )
      );
    }
  }
}

// Check for rating deadlines (23 hours after match completion - 1 hour warning)
export async function notifyRatingDeadlines() {
  // Find matches completed 23 hours ago (1 hour before 24-hour deadline)
  const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000);
  const twentyTwoHoursAgo = new Date(Date.now() - 22 * 60 * 60 * 1000);

  const completedMatches = await prisma.match.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: {
        gte: twentyThreeHoursAgo, // Greater than or equal to 23 hours ago
        lt: twentyTwoHoursAgo, // Less than 22 hours ago (1-hour window)
      },
    },
    include: {
      game: true,
      participants: true,
    },
  });

  for (const match of completedMatches) {
    for (const participant of match.participants) {
      // Check if user has already rated this match
      const hasRated = await prisma.rating.findFirst({
        where: {
          matchId: match.id,
          raterId: participant.userId,
        },
      });

      if (!hasRated) {
        // For 1v1 matches (maxPlayers = 2), redirect to outcome page
        // For team matches, redirect to team confirmation page first
        const redirectLink =
          match.maxPlayers === 2
            ? `/match-report-outcome?matchId=${match.id}`
            : `/match-teams-confirmation?matchId=${match.id}`;

        await createNotification({
          userId: participant.userId,
          type: "rating_deadline",
          data: {
            game: match.game,
            match: match,
          },
          redirectLink: redirectLink,
        });
      }
    }
  }
}

// Close rating windows after 24 hours
export async function closeExpiredRatingWindows() {
  // Find matches completed more than 24 hours ago
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const expiredMatches = await prisma.match.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: {
        lt: twentyFourHoursAgo,
      },
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  if (expiredMatches.length > 0) {
    console.log(
      `Found ${expiredMatches.length} matches with expired rating windows (completed >24h ago)`
    );
  }
}

// You can call these functions from a cron job or scheduler
// Example:
// import { notifyUpcomingMatches, notifyCompletedMatches } from "./notifyMatchesCron";
// await notifyUpcomingMatches();
// await notifyCompletedMatches();
