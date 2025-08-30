// Types for notification templates
//
// Usage Examples:
//
// Basic notification (static):
// const notification = notificationsData.match_created;
//
// Dynamic notification with props:
// const notification = getNotificationData('match_created', { gameType: '1v1 Tennis' });
// Result: { title: "1v1 Tennis Created!", content: "Boom! Your 1v1 Tennis is live and ready for players." }
//
// const notification = getNotificationData('match_created', { gameType: '1v1 Padel' });
// Result: { title: "1v1 Padel Match Created!", content: "Boom! Your 1v1 Padel is live and ready for players." }

type NotificationProps = {
  gameType?: string;
  playerName?: string;
  matchDate?: string;
  achievementName?: string;
  milestoneType?: string;
  location?: string;
  date?: string;
  time?: string;
  newTime?: string;
  newLocation?: string;
  missingPlayers?: string;
  milestone?: string;
  [key: string]: any;
};

type NotificationTemplate = (props: NotificationProps) => string;

interface NotificationData {
  title: string;
  content: string;
  type: string;
  urgency: string;
  category: string;
  titleTemplate?: NotificationTemplate;
  contentTemplate?: NotificationTemplate;
}

export const notificationsData = {
  // game_suggested: {
  //   title: "Game Suggested For You",
  //   content: "We found a match that fits your vibe. Wanna join?",
  //   type: "ENGAGEMENT",
  //   urgency: "ROUTINE",
  //   category: "GAME",
  //   titleTemplate: (props: NotificationProps) =>
  //     `${props.gameType || "Game"} Suggested For You`,
  //   contentTemplate: (props: NotificationProps) =>
  //     `We found a ${
  //       props.gameType || "match"
  //     } that fits your vibe. Wanna join?`,
  // },
  match_created: {
    title: "Match Created!",
    content: "Boom! Your match is live and ready for players.",
    type: "MATCH",
    urgency: "ROUTINE",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => {
      const gameType = props.gameType || "Match";
      // Special case for padel to include "Match" in the title
      if (gameType.toLowerCase().includes("padel")) {
        return gameType.includes("Match")
          ? `${gameType} Created!`
          : `${gameType} Match Created!`;
      }
      return `${gameType} Created!`;
    },
    contentTemplate: (props: NotificationProps) =>
      `Boom! Your ${props.gameType || "match"} is live and ready for players.`,
  },
  match_request_approved: {
    title: "Match Request Approved!",
    content:
      "Great news! Your match request has been approved and is now live.",
    type: "MATCH",
    urgency: "ROUTINE",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => {
      const gameType = props.gameType || "Match";
      // Special case for padel to include "Match" in the title
      if (gameType.toLowerCase().includes("padel")) {
        return gameType.includes("Match")
          ? `${gameType} Request Approved!`
          : `${gameType} Match Request Approved!`;
      }
      return `${gameType} Request Approved!`;
    },
    contentTemplate: (props: NotificationProps) =>
      `Great news! Your ${
        props.gameType || "match"
      } request has been approved and is now live. Players can now join!`,
  },
  match_joined: {
    title: "You're In! Spot Confirmed",
    content: "You're all set for your game.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => "You're In! Spot Confirmed",
    contentTemplate: (props: NotificationProps) =>
      `You're all set for ${props.gameType || "your game"}${
        props.location ? ` at ${props.location}` : ""
      }${props.date ? ` on ${props.date}` : ""}.`,
  },
  match_full: {
    title: "Game Just Filled Up",
    content: "Your game is now full. Get ready to play!",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => "Game Just Filled Up",
    contentTemplate: (props: NotificationProps) =>
      `Your ${props.gameType || "game"}${
        props.time ? ` at ${props.time}` : ""
      } is now full. Get ready to play!`,
  },
  match_cancelled: {
    title: "Game Cancelled",
    content: "Your game has been cancelled. You won't be charged.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => "Game Cancelled",
    contentTemplate: (props: NotificationProps) =>
      `Your game${props.location ? ` at ${props.location}` : ""}${
        props.date ? ` on ${props.date}` : ""
      } has been cancelled. You won't be charged.`,
  },
  player_left_match: {
    title: "Player Dropped Out — Spot Available Again",
    content:
      "A player just left your upcoming game. Invite someone or repost to fill the slot.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      "Player Dropped Out — Spot Available Again",
    contentTemplate: (props: NotificationProps) =>
      `A player dropped out of the ${
        props.gameType || "game"
      }. Spot's open again.`,
  },
  player_joined_match: {
    title: "New Player Joined",
    content: "Someone just joined your match. Let the games begin!",
    type: "MATCH",
    urgency: "ROUTINE",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `New Player Joined ${props.gameType || "Match"}`,
    contentTemplate: (props: NotificationProps) =>
      `Someone just joined your ${
        props.gameType || "match"
      }. Let the games begin!`,
  },
  match_reminder_2_hours: {
    title: "Game Starts in 2 Hours — Get Ready!",
    content: "Your game is coming up. Start preparing and plan your journey!",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `Game Starts in 2 Hours — Get Ready!`,
    contentTemplate: (props: NotificationProps) =>
      `Your ${props.gameType || "game"}${
        props.time ? ` at ${props.time}` : ""
      }${
        props.location ? ` at ${props.location}` : ""
      } is coming up. Start preparing and plan your journey!`,
  },

  match_reminder_30_min: {
    title: "Game Starts in 30 Minutes — Head Out Soon!",
    content: "Time to gear up and head to your game location!",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `Game Starts in 30 Minutes — Head Out Soon!`,
    contentTemplate: (props: NotificationProps) =>
      `Your ${props.gameType || "game"}${
        props.time ? ` at ${props.time}` : ""
      } starts soon. Time to gear up and head to your game location!`,
  },

  match_started: {
    title: "Match Started",
    content: "Game on! Time to bring your A-game.",
    type: "MATCH",
    urgency: "ROUTINE",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `${props.gameType || "Match"} Started`,
    contentTemplate: (props: NotificationProps) =>
      `Game on! Time to bring your A-game to this ${
        props.gameType || "match"
      }.`,
  },
  match_completed: {
    title: "Match Completed",
    content: "Done and dusted. Hope you had fun!",
    type: "MATCH",
    urgency: "ROUTINE",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `${props.gameType || "Match"} Completed`,
    contentTemplate: (props: NotificationProps) =>
      `Done and dusted. Hope you had fun playing ${props.gameType || ""}!`,
  },
  match_result_reported: {
    title: "Result Reported",
    content: "Match result is in. Check out how it ended.",
    type: "MATCH",
    urgency: "ROUTINE",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `${props.gameType || "Match"} Result Reported`,
    contentTemplate: (props: NotificationProps) =>
      `${props.gameType || "Match"} result is in. Check out how it ended.`,
  },
  result_disputed: {
    title: "Result Disputed",
    content: "A player has disputed the match result. Awaiting resolution.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `${props.gameType || "Match"} Result Disputed`,
    contentTemplate: (props: NotificationProps) =>
      `A player has disputed the ${
        props.gameType || "match"
      } result. Awaiting resolution.`,
  },
  no_show_reported: {
    title: "No Show Reported",
    content: "A player didn't show. We've taken note.",
    type: "BEHAVIOR",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `No Show Reported - ${props.gameType || "Match"}`,
    contentTemplate: (props: NotificationProps) =>
      `A player didn't show for the ${
        props.gameType || "match"
      }. We've taken note.`,
  },
  no_show_resolved: {
    title: "No-Show Case Resolved",
    content: "Your no-show case has been reviewed and resolved.",
    type: "BEHAVIOR",
    urgency: "ROUTINE",
    category: "GAME",
  },
  player_reported_you: {
    title: "Behavior Reported",
    content:
      "A player has submitted a report about your conduct. Please review.",
    type: "BEHAVIOR",
    urgency: "URGENT",
    category: "GAME",
  },
  // achievement_unlocked: {
  //   title: "You Just Hit a Milestone!",
  //   content:
  //     "You've reached a new milestone. Congrats — check your profile badge.",
  //   type: "PROGRESS",
  //   urgency: "URGENT",
  //   category: "SYSTEM",
  //   titleTemplate: (props: NotificationProps) => "You Just Hit a Milestone!",
  //   contentTemplate: (props: NotificationProps) =>
  //     `You've reached ${
  //       props.milestone ||
  //       props.achievementName ||
  //       "[X games / win streak / new tier]"
  //     }. Congrats — check your profile badge.`,
  // },
  // milestone_reached: {
  //   title: "Milestone Reached",
  //   content: "Milestone unlocked! You're on a roll.",
  //   type: "PROGRESS",
  //   urgency: "ROUTINE",
  //   category: "SYSTEM",
  //   titleTemplate: (props: NotificationProps) =>
  //     `${props.milestoneType || "Milestone"} Reached`,
  //   contentTemplate: (props: NotificationProps) =>
  //     `${props.milestoneType || "Milestone"} unlocked! You're on a roll.`,
  // },
  match_rescheduled: {
    title: "Match Rescheduled",
    content: "This match got a new time. Don't be late!",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `${props.gameType || "Match"} Rescheduled`,
    contentTemplate: (props: NotificationProps) =>
      `This ${props.gameType || "match"} got a new time${
        props.matchDate ? ` - ${props.matchDate}` : ""
      }. Don't be late!`,
  },
  player_rated_you: {
    title: "You were rated",
    content: "You just got rated. Tap to see the feedback.",
    type: "FEEDBACK",
    urgency: "ROUTINE",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `You were rated${props.gameType ? ` - ${props.gameType}` : ""}`,
    contentTemplate: (props: NotificationProps) =>
      `You just got rated${
        props.gameType ? ` for the ${props.gameType}` : ""
      }. Tap to see the feedback.`,
  },
  payment_successful: {
    title: "Payment Confirmed",
    content: "Money received! You're all set.",
    type: "PAYMENT",
    urgency: "ROUTINE",
    category: "SYSTEM",
    titleTemplate: (props: NotificationProps) =>
      `Payment Confirmed${props.gameType ? ` - ${props.gameType}` : ""}`,
    contentTemplate: (props: NotificationProps) =>
      `Money received! You're all set${
        props.gameType ? ` for the ${props.gameType}` : ""
      }.`,
  },
  refund_issued: {
    title: "Refund processed",
    content: "Refund processed. Back to your wallet it goes.",
    type: "PAYMENT",
    urgency: "ROUTINE",
    category: "SYSTEM",
    titleTemplate: (props: NotificationProps) =>
      `Refund Processed${props.gameType ? ` - ${props.gameType}` : ""}`,
    contentTemplate: (props: NotificationProps) =>
      `Refund processed${
        props.gameType ? ` for the ${props.gameType}` : ""
      }. Back to your wallet it goes.`,
  },

  // Additional Urgent Notifications for Enhanced User Experience
  game_cancelled_low_attendance: {
    title: "Game Cancelled Due to Low Attendance",
    content:
      "Not enough players joined. We've cancelled your game and refunded your spot.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
  },

  admin_cancelled_booking: {
    title: "Admin Cancelled Your Booking",
    content:
      "Your booking was cancelled by the Playdate team. You'll receive a refund.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => "Admin Cancelled Your Booking",
    contentTemplate: (props: NotificationProps) =>
      `Your booking${props.location ? ` at ${props.location}` : ""}${
        props.date ? ` on ${props.date}` : ""
      } was cancelled by the Playdate team. You'll receive a refund.`,
  },

  you_cancelled_spot: {
    title: "You Cancelled Your Spot",
    content:
      "You've successfully cancelled your spot. Refund is under process.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => "You Cancelled Your Spot",
    contentTemplate: (props: NotificationProps) =>
      `You've successfully cancelled your spot${
        props.gameType ? ` in ${props.gameType}` : ""
      }${props.date ? ` on ${props.date}` : ""}. Refund is under process.`,
  },

  you_cancelled_spot_no_refund: {
    title: "You Cancelled Your Spot",
    content:
      "You've successfully cancelled your spot. Due to short notice, we can't refund you.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => "You Cancelled Your Spot",
    contentTemplate: (props: NotificationProps) =>
      `You've successfully cancelled your spot${
        props.gameType ? ` in ${props.gameType}` : ""
      }${
        props.date ? ` on ${props.date}` : ""
      }. Due to short notice, we can't refund you.`,
  },

  time_change: {
    title: "Time Change: Your Game is Now at [NEW TIME]",
    content: "Heads up! Your game has been moved. Same location.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      `Time Change: Your Game is Now at ${props.newTime || "[NEW TIME]"}`,
    contentTemplate: (props: NotificationProps) =>
      `Heads up! Your ${props.gameType || "game"}${
        props.date ? ` on ${props.date}` : ""
      } has been moved to ${props.newTime || "[NEW TIME]"}. Same location.`,
  },

  venue_change: {
    title: "Venue Change: New Location for Your Game",
    content:
      "Update: Your game has moved to a new location. Same date and time.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      "Venue Change: New Location for Your Game",
    contentTemplate: (props: NotificationProps) =>
      `Update: Your ${props.gameType || "game"} has moved to ${
        props.newLocation || "[NEW LOCATION]"
      }. Same date and time.`,
  },

  // team_shuffle_alert: {
  //   title: "Team Shuffle Alert",
  //   content:
  //     "A last-minute drop led to a team reshuffle for your game. Check the new lineup.",
  //   type: "MATCH",
  //   urgency: "URGENT",
  //   category: "GAME",
  //   titleTemplate: (props: NotificationProps) => "Team Shuffle Alert",
  //   contentTemplate: (props: NotificationProps) =>
  //     `A last-minute drop led to a team reshuffle for your game${
  //       props.time ? ` at ${props.time}` : ""
  //     }. Check the new lineup.`,
  // },

  removed_from_game: {
    title: "You've Been Removed from the Game",
    content:
      "Unfortunately, you lost your spot due to late payment or inactivity. Check other open games.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
  },

  missing_player_alert: {
    title: "Missing Player Alert",
    content:
      "Your game starts in 2 hours and you're still missing players. Need help filling it?",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => "Missing Player Alert",
    contentTemplate: (props: NotificationProps) =>
      `Your game starts in 2 hours and you're still missing ${
        props.missingPlayers || "[1/2/3]"
      } player(s). Need help filling it?`,
  },

  marked_no_show: {
    title: "You were marked as a No Show",
    content: "You missed your game. If this wasn't you, tap to dispute.",
    type: "BEHAVIOR",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => "You were marked as a No Show",
    contentTemplate: (props: NotificationProps) =>
      `You missed your game${
        props.time ? ` at ${props.time}` : ""
      }. If this wasn't you, tap to dispute.`,
  },

  teammate_no_show: {
    title: "No Show From a Player in Your Game",
    content: "A teammate didn't show up. Let us know how the game went.",
    type: "BEHAVIOR",
    urgency: "URGENT",
    category: "GAME",
  },

  payment_failed: {
    title: "Payment Failed — Action Needed",
    content: "Your payment didn't go through. Update your payment method.",
    type: "PAYMENT",
    urgency: "URGENT",
    category: "SYSTEM",
    titleTemplate: (props: NotificationProps) =>
      "Payment Failed — Action Needed",
    contentTemplate: (props: NotificationProps) =>
      `Your payment for ${props.gameType || "the game"}${
        props.location ? ` at ${props.location}` : ""
      } didn't go through. Update your payment method.`,
  },

  booking_error: {
    title: "Booking Error — Contact Us",
    content:
      "Something went wrong while securing your spot. Tap here and we'll fix it quickly.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
  },

  submit_game_results: {
    title: "Submit Your Game Results",
    content: "Your match has ended — tell us the outcome to update rankings.",
    type: "MATCH",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) => "Submit Your Game Results",
    contentTemplate: (props: NotificationProps) =>
      `Your ${props.gameType || "match"}${
        props.time ? ` at ${props.time}` : ""
      } has ended — tell us the outcome to update rankings.`,
  },

  rating_deadline: {
    title: "Rating Deadline — Last Call to Rate Your Game",
    content:
      "You have 1 hour left to rate your teammates before the window closes.",
    type: "FEEDBACK",
    urgency: "URGENT",
    category: "GAME",
    titleTemplate: (props: NotificationProps) =>
      "Rating Deadline — Last Call to Rate Your Game",
    contentTemplate: (props: NotificationProps) =>
      `You have 1 hour left to rate your teammates from the ${
        props.gameType || "game"
      }. Rating window closes 24 hours after match completion.`,
  },

  // profile_image_rejected: {
  //   title: "Profile Image Rejected",
  //   content:
  //     "Your profile photo doesn't meet our community guidelines. Please upload a new one.",
  //   type: "BEHAVIOR",
  //   urgency: "URGENT",
  //   category: "SYSTEM",
  // },

  account_under_review: {
    title: "Account Under Review",
    content:
      "We've temporarily paused your bookings. Check your email for next steps.",
    type: "BEHAVIOR",
    urgency: "URGENT",
    category: "SYSTEM",
  },

  // suspicious_activity: {
  //   title: "Suspicious Activity Detected",
  //   content:
  //     "We spotted some unusual behavior. Contact support to verify your account.",
  //   type: "BEHAVIOR",
  //   urgency: "URGENT",
  //   category: "SYSTEM",
  // },
} as const;

// Helper function to get notification with custom props
export const getNotificationData = (
  notificationType: keyof typeof notificationsData,
  props?: NotificationProps
): {
  title: string;
  content: string;
  type: string;
  urgency: string;
  category: string;
} => {
  const notification = notificationsData[notificationType] as any;

  return {
    title:
      props && notification.titleTemplate
        ? notification.titleTemplate(props)
        : notification.title,
    content:
      props && notification.contentTemplate
        ? notification.contentTemplate(props)
        : notification.content,
    type: notification.type,
    urgency: notification.urgency,
    category: notification.category,
  };
};
