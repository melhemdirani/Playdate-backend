# Dynamic Notification Examples

Now that dynamic notifications are enabled by default, here are examples of how they work:

## Example 1: Match Created with Game Type

**Input:**

```typescript
await createNotification({
  userId: "user123",
  type: "match_created",
  data: {
    game: { name: "1v1 Tennis" },
  },
});
```

**Result:**

- Title: "1v1 Tennis Created!"
- Content: "Boom! Your 1v1 Tennis is live and ready for players."

## Example 2: Match Approved with Date

**Input:**

```typescript
await createNotification({
  userId: "user123",
  type: "match_approved",
  data: {
    game: { name: "3v3 Basketball" },
    match: { scheduledAt: "2025-01-26T16:04:00Z" },
  },
});
```

**Result:**

- Title: "3v3 Basketball Confirmed!"
- Content: "Your 3v3 Basketball has been approved and scheduled for 1/26/2025."

## Example 3: Achievement Unlocked

**Input:**

```typescript
await createNotification({
  userId: "user123",
  type: "achievement_unlocked",
  data: {
    achievement: { name: "First Win" },
  },
});
```

**Result:**

- Title: "Achievement Unlocked: First Win"
- Content: "Look at you go! You've unlocked the \"First Win\" achievement."

## Example 4: No Show Reported

**Input:**

```typescript
await createNotification({
  userId: "user123",
  type: "no_show_reported",
  data: {
    game: { name: "5v5 Football" },
  },
});
```

**Result:**

- Title: "No Show Reported - 5v5 Football"
- Content: "A player didn't show for the 5v5 Football. We've taken note."

## Example 5: Basic Notification (No Game Data)

**Input:**

```typescript
await createNotification({
  userId: "user123",
  type: "match_created",
  // No data object
});
```

**Result (Fallback to defaults):**

- Title: "Match Created!"
- Content: "Boom! Your match is live and ready for players."

## How It Works

The system automatically extracts these props from your `data` object:

- `gameType` → from `data.game.name`
- `playerName` → from `data.player.name`
- `matchDate` → from `data.match.scheduledAt` (formatted)
- `achievementName` → from `data.achievement.name`
- `milestoneType` → from `data.milestone.type`

If any of these are missing, the templates fall back to generic terms like "Match", "Game", etc.
