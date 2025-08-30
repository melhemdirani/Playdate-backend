# 🚀 Notification Testing Guide

## Fastest Ways to Test All Notification Features

### 🏃‍♂️ Quick Start (30 seconds)

1. **Ensure server is running:**

   ```bash
   npm run dev
   ```

2. **Run the quick test:**
   ```bash
   node quick-notification-test.js
   ```

### 🧪 Comprehensive Testing (2 minutes)

#### Option 1: Node.js Script

```bash
node test-notifications.js
```

#### Option 2: Bash Script (Linux/Mac/WSL)

```bash
chmod +x test-notifications.sh
./test-notifications.sh
```

#### Option 3: Manual API Testing

```bash
# 1. Login first
curl -X POST http://localhost:4000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Use the token from response for notification testing
```

## 📋 What Gets Tested

### ✅ Core Features

- [x] **Notification Creation** - All 42+ notification types
- [x] **Dynamic Content** - Template system with game data
- [x] **Notification Retrieval** - Get user notifications
- [x] **Mark as Seen** - Update notification status
- [x] **Delete Notifications** - Remove notifications
- [x] **Push Notifications** - Expo push integration
- [x] **Email Notifications** - Nodemailer integration

### ✅ Notification Types Tested

#### Match & Game Related (23 types)

- `game_suggested` - Game recommendations
- `match_created` - New match creation
- `match_request_approved` - Match approval
- `match_joined` - Player joined
- `match_full` - Game filled up
- `match_cancelled` - Game cancellation
- `player_left_match` - Player dropout
- `player_joined_match` - New player joined
- `match_reminder` - Game starting soon
- `match_started` - Game has started
- `match_completed` - Game finished
- `match_result_reported` - Results submitted
- `match_rescheduled` - Time/date change
- `time_change` - Specific time change
- `venue_change` - Location change
- `team_shuffle_alert` - Team reorganization
- `removed_from_game` - Player removed
- `missing_player_alert` - Need more players
- `game_starts_soon` - 1 hour reminder
- `submit_game_results` - Submit outcome
- `waitlist_spot_available` - Waitlist cleared
- `added_to_waitlist` - Added to waitlist
- `game_cancelled_low_attendance` - Not enough players

#### Behavior & Moderation (7 types)

- `no_show_reported` - Player didn't show
- `no_show_resolved` - No-show case closed
- `player_reported_you` - Conduct report
- `marked_no_show` - You were no-show
- `teammate_no_show` - Teammate missed
- `profile_image_rejected` - Image violation
- `account_under_review` - Account suspended
- `suspicious_activity` - Security alert

#### Progress & Achievements (3 types)

- `achievement_unlocked` - New achievement
- `milestone_reached` - Progress milestone
- `player_rated_you` - Rating received

#### Payment Related (4 types)

- `payment_successful` - Payment confirmed
- `refund_issued` - Refund processed
- `payment_failed` - Payment error
- `admin_cancelled_booking` - Admin cancellation

#### System & Misc (5 types)

- `you_cancelled_spot` - Self cancellation
- `booking_error` - System error
- `rating_deadline` - Rating reminder

### ✅ Dynamic Features Tested

#### Template System

- **Title Templates** - Dynamic titles based on game type
- **Content Templates** - Dynamic content with player data
- **Fallback Handling** - Default content when data missing

#### Data Integration

- **Game Information** - Name, type, image
- **Match Details** - Date, time, location
- **Player Data** - Names, achievements
- **Dynamic Props** - Custom data fields

## 🛠️ Prerequisites

### 1. Test User Account

Create a test user (if not exists):

```bash
curl -X POST http://localhost:4000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser"
  }'
```

### 2. Database Setup

Ensure your database is running and seeded with:

- Sample games
- Sample locations
- Test user data

### 3. Environment Variables

Check these are configured:

- Database connection
- JWT secret
- Expo push token (optional)
- Email configuration (optional)

## 📊 Test Results Overview

After running tests, you should see:

```
📋 TEST SUMMARY:
================
✅ Total notification types tested: 42
✅ Successfully created: 42
✅ Mark as seen tested: 5
✅ Delete tested: 3
✅ Final notifications count: 34
🎉 All notification features tested successfully!
```

## 🐛 Troubleshooting

### Common Issues

1. **Login Failed**

   - Check test user exists
   - Verify credentials in test scripts

2. **Token Expired**

   - Re-run login step
   - Check JWT secret configuration

3. **Database Errors**

   - Ensure database is running
   - Check Prisma connection

4. **Push Notification Failures**
   - Normal if no Expo tokens configured
   - Check Expo SDK setup

## 🎯 Advanced Testing

### Test Specific Notification Types

```bash
node quick-notification-test.js test match_created "5v5 Football"
node quick-notification-test.js test achievement_unlocked
```

### Test with Different Game Types

The system supports dynamic content for various game types:

- Tennis (1v1, 2v2)
- Football (5v5, 7v7, 11v11)
- Basketball (3v3, 5v5)
- Padel (1v1, 2v2)
- Custom games

### Database Verification

Check created notifications in your database:

```sql
SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 10;
```

## 📱 Real-World Testing

### With Mobile App

1. Install Expo push token on test device
2. Register device token with user
3. Trigger notifications via API
4. Verify push notifications appear

### Email Testing

1. Configure SMTP settings
2. Enable email notifications
3. Test various notification types
4. Check email delivery

## 🔄 Continuous Testing

### During Development

- Run quick test after code changes
- Use specific type testing for new features
- Monitor database for notification creation

### Before Deployment

- Run comprehensive test suite
- Verify all notification types work
- Test push notification delivery
- Validate email notifications

---

**Happy Testing! 🎉**
