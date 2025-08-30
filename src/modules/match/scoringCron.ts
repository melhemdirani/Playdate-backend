import * as cron from "node-cron";
import { prisma } from "../../db/db";
import { adjustScore } from "../match/matchService";

/**
 * Processes matches that were completed 24+ hours ago and haven't been scored yet.
 * Handles disputes by applying no score changes and marking outcome as DISPUTED.
 */
export function processCompletedMatchScores() {
  // Run every day at 2 AM
  // cron.schedule("0 2 * * *", async () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("Starting 24-hour post-match scoring process...");

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get matches completed 24+ hours ago that haven't been processed yet
      const matches = await prisma.match.findMany({
        where: {
          status: "COMPLETED",
          updatedAt: {
            lte: twentyFourHoursAgo,
          },
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          results: true,
        },
      });

      console.log(`Found ${matches.length} matches to process for scoring`);

      for (const match of matches) {
        await processMatchScoring(match);
      }

      console.log("24-hour post-match scoring process completed");
    } catch (error) {
      console.error("Error in 24-hour post-match scoring:", error);
    }
  });
}

async function processMatchScoring(match: any) {
  try {
    // Check if match has already been scored
    const existingResults = match.results;
    const hasResults = existingResults.length > 0;

    if (hasResults) {
      // Check if any results are still pending (haven't been processed for scoring)
      const pendingResults = existingResults.filter(
        (result: any) => !result.scoreProcessed // Now we have this field in the database
      );

      if (pendingResults.length === 0) {
        console.log(`Match ${match.id} already processed for scoring`);
        return;
      }
    }

    // Check if this is a team match (has team assignments)
    const hasTeams = match.participants.some((p: any) => p.team !== null);

    if (hasTeams) {
      await processTeamMatchScoring(match, existingResults);
    } else {
      await process1v1MatchScoring(match, existingResults);
    }
  } catch (error) {
    console.error(`Error processing match ${match.id}:`, error);
  }
}

async function processTeamMatchScoring(match: any, existingResults: any[]) {
  const team1Participants = match.participants.filter((p: any) => p.team === 1);
  const team2Participants = match.participants.filter((p: any) => p.team === 2);

  // Get results reported by each team
  const team1Results = existingResults.filter((result: any) =>
    team1Participants.some((p: any) => p.userId === result.userId)
  );
  const team2Results = existingResults.filter((result: any) =>
    team2Participants.some((p: any) => p.userId === result.userId)
  );

  // Determine team outcomes
  const team1Outcome = getTeamConsensusOutcome(team1Results);
  const team2Outcome = getTeamConsensusOutcome(team2Results);

  // Check for disputes
  const isDisputed =
    team1Outcome &&
    team2Outcome &&
    ((team1Outcome === "WON" && team2Outcome === "WON") ||
      (team1Outcome === "LOST" && team2Outcome === "LOST"));

  if (isDisputed) {
    console.log(
      `Match ${match.id} has conflicting team reports - marking as DISPUTED`
    );

    // Mark all results as DISPUTED and don't adjust scores
    for (const participant of match.participants) {
      await updateOrCreateMatchResult(
        match.id,
        participant.userId,
        "DISPUTED",
        true
      );
    }
  } else {
    // Process normal scoring
    const finalOutcome = team1Outcome || team2Outcome;

    if (finalOutcome) {
      // Apply outcomes to all team members
      for (const participant of team1Participants) {
        const outcome =
          finalOutcome === "WON"
            ? "WON"
            : finalOutcome === "LOST"
            ? "LOST"
            : "DRAW";
        await applyScoreAdjustment(match, participant, outcome);
      }

      for (const participant of team2Participants) {
        const outcome =
          finalOutcome === "WON"
            ? "LOST"
            : finalOutcome === "LOST"
            ? "WON"
            : "DRAW";
        await applyScoreAdjustment(match, participant, outcome);
      }
    } else {
      // No reports from any team - no action needed (as per requirement 5)
      console.log(`Match ${match.id} has no team reports - no scoring applied`);
    }
  }
}

async function process1v1MatchScoring(match: any, existingResults: any[]) {
  if (existingResults.length === 0) {
    // No reports - no action needed (as per requirement 5)
    console.log(`1v1 Match ${match.id} has no reports - no scoring applied`);
    return;
  }

  // Process each reported result
  for (const result of existingResults) {
    const participant = match.participants.find(
      (p: any) => p.userId === result.userId
    );
    if (participant && !result.scoreProcessed) {
      await applyScoreAdjustment(match, participant, result.outcome);
    }
  }
}

function getTeamConsensusOutcome(teamResults: any[]): string | null {
  if (teamResults.length === 0) return null;

  // Check if all team members agree on outcome
  const firstOutcome = teamResults[0].outcome;
  const allAgree = teamResults.every(
    (result: any) => result.outcome === firstOutcome
  );

  return allAgree ? firstOutcome : null;
}

async function applyScoreAdjustment(
  match: any,
  participant: any,
  outcome: string
) {
  try {
    // Skip if outcome is NO_SHOW (no scoring for no-shows)
    if (outcome === "NO_SHOW") {
      await updateOrCreateMatchResult(
        match.id,
        participant.userId,
        outcome,
        true
      );
      return;
    }

    // Get opponent for score calculation
    const opponent = match.participants.find(
      (p: any) => p.userId !== participant.userId
    );
    if (!opponent) {
      console.log(
        `No opponent found for participant ${participant.userId} in match ${match.id}`
      );
      return;
    }

    // Get user's current game score
    const userGame = await prisma.userGame.findFirst({
      where: {
        userId: participant.userId,
        gameId: match.gameId,
      },
      include: {
        gameScore: true,
      },
    });

    const opponentGame = await prisma.userGame.findFirst({
      where: {
        userId: opponent.userId,
        gameId: match.gameId,
      },
      include: {
        gameScore: true,
      },
    });

    if (!userGame?.gameScore || !opponentGame?.gameScore) {
      console.log(`Missing game scores for match ${match.id} participants`);
      return;
    }

    // Apply score adjustment
    const scoreResult = adjustScore({
      outcome: outcome as "WON" | "LOST" | "DRAW",
      userLevel: userGame.gameScore.level,
      opponentLevel: opponentGame.gameScore.level,
      currentScore: userGame.gameScore.score,
    });

    // Update user's score and level
    await prisma.userGameScore.update({
      where: { id: userGame.gameScore.id },
      data: {
        score: scoreResult.newScore,
        level: scoreResult.newLevel,
      },
    });

    // Update or create match result with processed flag
    await updateOrCreateMatchResult(
      match.id,
      participant.userId,
      outcome,
      true
    );

    console.log(
      `Applied score adjustment for user ${participant.userId}: ${outcome}, score: ${userGame.gameScore.score} -> ${scoreResult.newScore}, level: ${scoreResult.newLevel}`
    );
  } catch (error) {
    console.error(
      `Error applying score adjustment for user ${participant.userId}:`,
      error
    );
  }
}

async function updateOrCreateMatchResult(
  matchId: string,
  userId: string,
  outcome: string,
  scoreProcessed: boolean
) {
  // Check if result already exists
  const existingResult = await prisma.matchResult.findFirst({
    where: {
      matchId,
      userId,
    },
  });

  if (existingResult) {
    // Update existing result
    await prisma.matchResult.update({
      where: { id: existingResult.id },
      data: {
        outcome: outcome as any,
        scoreProcessed,
      },
    });
  } else {
    // Create new result (for cases where no one reported but we need to mark as processed)
    await prisma.matchResult.create({
      data: {
        matchId,
        userId,
        outcome: outcome as any,
        scoreProcessed,
      },
    });
  }
}
