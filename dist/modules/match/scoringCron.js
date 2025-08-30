"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCompletedMatchScores = void 0;
const cron = __importStar(require("node-cron"));
const db_1 = require("../../db/db");
const matchService_1 = require("../match/matchService");
/**
 * Processes matches that were completed 24+ hours ago and haven't been scored yet.
 * Handles disputes by applying no score changes and marking outcome as DISPUTED.
 */
function processCompletedMatchScores() {
    // Run every day at 2 AM
    // cron.schedule("0 2 * * *", async () => {
    cron.schedule("*/1 * * * *", async () => {
        console.log("Starting 24-hour post-match scoring process...");
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            // Get matches completed 24+ hours ago that haven't been processed yet
            const matches = await db_1.prisma.match.findMany({
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
        }
        catch (error) {
            console.error("Error in 24-hour post-match scoring:", error);
        }
    });
}
exports.processCompletedMatchScores = processCompletedMatchScores;
async function processMatchScoring(match) {
    try {
        // Check if match has already been scored
        const existingResults = match.results;
        const hasResults = existingResults.length > 0;
        if (hasResults) {
            // Check if any results are still pending (haven't been processed for scoring)
            const pendingResults = existingResults.filter((result) => !result.scoreProcessed // Now we have this field in the database
            );
            if (pendingResults.length === 0) {
                console.log(`Match ${match.id} already processed for scoring`);
                return;
            }
        }
        // Check if this is a team match (has team assignments)
        const hasTeams = match.participants.some((p) => p.team !== null);
        if (hasTeams) {
            await processTeamMatchScoring(match, existingResults);
        }
        else {
            await process1v1MatchScoring(match, existingResults);
        }
    }
    catch (error) {
        console.error(`Error processing match ${match.id}:`, error);
    }
}
async function processTeamMatchScoring(match, existingResults) {
    const team1Participants = match.participants.filter((p) => p.team === 1);
    const team2Participants = match.participants.filter((p) => p.team === 2);
    // Get results reported by each team
    const team1Results = existingResults.filter((result) => team1Participants.some((p) => p.userId === result.userId));
    const team2Results = existingResults.filter((result) => team2Participants.some((p) => p.userId === result.userId));
    // Determine team outcomes
    const team1Outcome = getTeamConsensusOutcome(team1Results);
    const team2Outcome = getTeamConsensusOutcome(team2Results);
    // Check for disputes
    const isDisputed = team1Outcome &&
        team2Outcome &&
        ((team1Outcome === "WON" && team2Outcome === "WON") ||
            (team1Outcome === "LOST" && team2Outcome === "LOST"));
    if (isDisputed) {
        console.log(`Match ${match.id} has conflicting team reports - marking as DISPUTED`);
        // Mark all results as DISPUTED and don't adjust scores
        for (const participant of match.participants) {
            await updateOrCreateMatchResult(match.id, participant.userId, "DISPUTED", true);
        }
    }
    else {
        // Process normal scoring
        const finalOutcome = team1Outcome || team2Outcome;
        if (finalOutcome) {
            // Apply outcomes to all team members
            for (const participant of team1Participants) {
                const outcome = finalOutcome === "WON"
                    ? "WON"
                    : finalOutcome === "LOST"
                        ? "LOST"
                        : "DRAW";
                await applyScoreAdjustment(match, participant, outcome);
            }
            for (const participant of team2Participants) {
                const outcome = finalOutcome === "WON"
                    ? "LOST"
                    : finalOutcome === "LOST"
                        ? "WON"
                        : "DRAW";
                await applyScoreAdjustment(match, participant, outcome);
            }
        }
        else {
            // No reports from any team - no action needed (as per requirement 5)
            console.log(`Match ${match.id} has no team reports - no scoring applied`);
        }
    }
}
async function process1v1MatchScoring(match, existingResults) {
    if (existingResults.length === 0) {
        // No reports - no action needed (as per requirement 5)
        console.log(`1v1 Match ${match.id} has no reports - no scoring applied`);
        return;
    }
    // Process each reported result
    for (const result of existingResults) {
        const participant = match.participants.find((p) => p.userId === result.userId);
        if (participant && !result.scoreProcessed) {
            await applyScoreAdjustment(match, participant, result.outcome);
        }
    }
}
function getTeamConsensusOutcome(teamResults) {
    if (teamResults.length === 0)
        return null;
    // Check if all team members agree on outcome
    const firstOutcome = teamResults[0].outcome;
    const allAgree = teamResults.every((result) => result.outcome === firstOutcome);
    return allAgree ? firstOutcome : null;
}
async function applyScoreAdjustment(match, participant, outcome) {
    try {
        // Skip if outcome is NO_SHOW (no scoring for no-shows)
        if (outcome === "NO_SHOW") {
            await updateOrCreateMatchResult(match.id, participant.userId, outcome, true);
            return;
        }
        // Get opponent for score calculation
        const opponent = match.participants.find((p) => p.userId !== participant.userId);
        if (!opponent) {
            console.log(`No opponent found for participant ${participant.userId} in match ${match.id}`);
            return;
        }
        // Get user's current game score
        const userGame = await db_1.prisma.userGame.findFirst({
            where: {
                userId: participant.userId,
                gameId: match.gameId,
            },
            include: {
                gameScore: true,
            },
        });
        const opponentGame = await db_1.prisma.userGame.findFirst({
            where: {
                userId: opponent.userId,
                gameId: match.gameId,
            },
            include: {
                gameScore: true,
            },
        });
        if (!(userGame === null || userGame === void 0 ? void 0 : userGame.gameScore) || !(opponentGame === null || opponentGame === void 0 ? void 0 : opponentGame.gameScore)) {
            console.log(`Missing game scores for match ${match.id} participants`);
            return;
        }
        // Apply score adjustment
        const scoreResult = (0, matchService_1.adjustScore)({
            outcome: outcome,
            userLevel: userGame.gameScore.level,
            opponentLevel: opponentGame.gameScore.level,
            currentScore: userGame.gameScore.score,
        });
        // Update user's score and level
        await db_1.prisma.userGameScore.update({
            where: { id: userGame.gameScore.id },
            data: {
                score: scoreResult.newScore,
                level: scoreResult.newLevel,
            },
        });
        // Update or create match result with processed flag
        await updateOrCreateMatchResult(match.id, participant.userId, outcome, true);
        console.log(`Applied score adjustment for user ${participant.userId}: ${outcome}, score: ${userGame.gameScore.score} -> ${scoreResult.newScore}, level: ${scoreResult.newLevel}`);
    }
    catch (error) {
        console.error(`Error applying score adjustment for user ${participant.userId}:`, error);
    }
}
async function updateOrCreateMatchResult(matchId, userId, outcome, scoreProcessed) {
    // Check if result already exists
    const existingResult = await db_1.prisma.matchResult.findFirst({
        where: {
            matchId,
            userId,
        },
    });
    if (existingResult) {
        // Update existing result
        await db_1.prisma.matchResult.update({
            where: { id: existingResult.id },
            data: {
                outcome: outcome,
                scoreProcessed,
            },
        });
    }
    else {
        // Create new result (for cases where no one reported but we need to mark as processed)
        await db_1.prisma.matchResult.create({
            data: {
                matchId,
                userId,
                outcome: outcome,
                scoreProcessed,
            },
        });
    }
}
