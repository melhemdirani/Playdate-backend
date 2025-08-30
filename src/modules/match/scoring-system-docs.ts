/**
 * 24-Hour Post-Match Scoring System Summary
 *
 * This system processes matches that were completed 24+ hours ago and applies scoring
 * based on reported outcomes, with special handling for team disputes.
 *
 * Key Features:
 * 1. Runs daily at 2 AM to process completed matches
 * 2. Handles both 1v1 and team matches
 * 3. Detects disputes when both teams claim victory
 * 4. Applies no score changes for draws (as per adjustScore function)
 * 5. No action taken when no reports are submitted (as per requirements)
 *
 * Dispute Resolution:
 * - Team disputes occur when Team 1 reports "WON" and Team 2 also reports "WON"
 * - Or when Team 1 reports "LOST" and Team 2 also reports "LOST"
 * - Disputed matches are marked with DISPUTED outcome and no scores are adjusted
 *
 * Database Changes:
 * - Added DISPUTED to MatchOutcome enum
 * - Added scoreProcessed boolean field to MatchResult model
 *
 * Flow:
 * 1. Find matches with status COMPLETED and updatedAt >= 24 hours ago
 * 2. For team matches: Check if both teams agree on outcome
 * 3. If disputed: Mark all participants as DISPUTED, no score changes
 * 4. If consensus: Apply team outcome to all team members
 * 5. For 1v1 matches: Process individual reports
 * 6. Use existing adjustScore() function for WON/LOST/DRAW outcomes
 * 7. Skip scoring for NO_SHOW outcomes
 * 8. Mark all results as scoreProcessed to prevent reprocessing
 *
 * Cron Schedule: "0 2 * * *" (Daily at 2 AM)
 * Integration: Added to server.ts with processCompletedMatchScores()
 */

// This file serves as documentation for the scoring system implementation
export const SCORING_SYSTEM_DOCS = {
  cronSchedule: "0 2 * * *", // Daily at 2 AM
  triggerCondition: "Matches completed 24+ hours ago with status COMPLETED",
  disputeDetection:
    "Both teams report conflicting outcomes (both WON or both LOST)",
  disputeResolution: "Mark as DISPUTED, apply no score changes",
  noReportsPolicy: "No action taken if no results reported",
  drawHandling: "Existing adjustScore() function handles draws appropriately",
};
