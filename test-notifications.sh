#!/bin/bash

# Notification Testing Script
# This script tests all notification features using curl commands

BASE_URL="http://192.168.65.1:4000"
NOTIFICATION_URL="$BASE_URL/notifications"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Notification Feature Testing${NC}"
echo "========================================"

# Step 1: Login to get auth token
echo -e "\n${YELLOW}1️⃣ Logging in to get auth token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "adnan@email.com",
    "password": "123123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed. Please ensure you have a test user with email: test@example.com${NC}"
  echo "You can create one by running:"
  echo "curl -X POST $BASE_URL/users/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"password123\",\"username\":\"testuser\"}'"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "User ID: $USER_ID"
echo "Token: ${TOKEN:0:20}..."

# Function to create a notification
create_notification() {
  local type=$1
  local title=$2
  
  echo -e "\n${BLUE}Testing: $type${NC}"
  
  RESPONSE=$(curl -s -X POST "$NOTIFICATION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"userId\": \"$USER_ID\",
      \"type\": \"$type\",
      \"data\": {
        \"game\": { \"name\": \"1v1 Tennis\" },
        \"match\": { \"scheduledAt\": \"$(date -Iseconds)\" },
        \"player\": { \"name\": \"John Doe\" },
        \"achievement\": { \"name\": \"First Win\" },
        \"location\": \"Central Park\",
        \"time\": \"2:00 PM\",
        \"newTime\": \"3:00 PM\"
      },
      \"redirectLink\": \"/test/$type\"
    }")
  
  if echo "$RESPONSE" | grep -q '"id"'; then
    echo -e "${GREEN}  ✅ Created successfully${NC}"
    # Extract notification ID for later use
    NOTIFICATION_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  ID: $NOTIFICATION_ID"
    return 0
  else
    echo -e "${RED}  ❌ Failed to create${NC}"
    echo "  Response: $RESPONSE"
    return 1
  fi
}

# Step 2: Test core notification types
echo -e "\n${YELLOW}2️⃣ Testing core notification types...${NC}"

# Array of notification types to test
notification_types=(
  "match_created"
  "game_suggested"
  "match_joined"
  "match_full"
  "match_cancelled"
  "match_reminder"
  "match_completed"
  "achievement_unlocked"
  "payment_successful"
  "no_show_reported"
  "time_change"
  "venue_change"
  "waitlist_spot_available"
)

successful_count=0
total_count=${#notification_types[@]}

for type in "${notification_types[@]}"; do
  if create_notification "$type"; then
    ((successful_count++))
  fi
  sleep 0.2  # Small delay to avoid overwhelming server
done

echo -e "\n${BLUE}📊 Creation Summary: $successful_count/$total_count notifications created${NC}"

# Step 3: Get all notifications
echo -e "\n${YELLOW}3️⃣ Testing notification retrieval...${NC}"
GET_RESPONSE=$(curl -s -X GET "$NOTIFICATION_URL" \
  -H "Authorization: Bearer $TOKEN")

if echo "$GET_RESPONSE" | grep -q '"notifications"'; then
  NOTIFICATION_COUNT=$(echo "$GET_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
  echo -e "${GREEN}✅ Retrieved $NOTIFICATION_COUNT notifications${NC}"
  
  # Get first notification ID for testing
  FIRST_NOTIFICATION_ID=$(echo "$GET_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
  echo -e "${RED}❌ Failed to retrieve notifications${NC}"
  echo "Response: $GET_RESPONSE"
fi

# Step 4: Test mark as seen
if [ ! -z "$FIRST_NOTIFICATION_ID" ]; then
  echo -e "\n${YELLOW}4️⃣ Testing mark as seen functionality...${NC}"
  SEEN_RESPONSE=$(curl -s -X PATCH "$NOTIFICATION_URL/$FIRST_NOTIFICATION_ID/seen" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$SEEN_RESPONSE" | grep -q -E '(success|seen)'; then
    echo -e "${GREEN}✅ Successfully marked notification as seen${NC}"
  else
    echo -e "${RED}❌ Failed to mark as seen${NC}"
    echo "Response: $SEEN_RESPONSE"
  fi
fi

# Step 5: Test delete notification
if [ ! -z "$FIRST_NOTIFICATION_ID" ]; then
  echo -e "\n${YELLOW}5️⃣ Testing delete functionality...${NC}"
  DELETE_RESPONSE=$(curl -s -X DELETE "$NOTIFICATION_URL/$FIRST_NOTIFICATION_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$DELETE_RESPONSE" | grep -q -E '(success|deleted)'; then
    echo -e "${GREEN}✅ Successfully deleted notification${NC}"
  else
    echo -e "${RED}❌ Failed to delete notification${NC}"
    echo "Response: $DELETE_RESPONSE"
  fi
fi

# Step 6: Test dynamic notification variations
echo -e "\n${YELLOW}6️⃣ Testing dynamic notification variations...${NC}"

# Test match_created with different game types
echo -e "\n${BLUE}Testing dynamic content generation:${NC}"

game_types=("1v1 Tennis" "5v5 Football" "3v3 Basketball" "1v1 Padel")

for game_type in "${game_types[@]}"; do
  echo -e "\n  Testing with game type: $game_type"
  
  DYNAMIC_RESPONSE=$(curl -s -X POST "$NOTIFICATION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"userId\": \"$USER_ID\",
      \"type\": \"match_created\",
      \"data\": {
        \"game\": { \"name\": \"$game_type\" }
      },
      \"redirectLink\": \"/test/dynamic\"
    }")
  
  if echo "$DYNAMIC_RESPONSE" | grep -q '"id"'; then
    echo -e "${GREEN}    ✅ Dynamic notification created${NC}"
  else
    echo -e "${RED}    ❌ Failed${NC}"
  fi
done

# Final summary
echo -e "\n${BLUE}🎉 TESTING COMPLETE!${NC}"
echo "==================="
echo -e "${GREEN}✅ Notification API endpoints tested${NC}"
echo -e "${GREEN}✅ Dynamic content generation tested${NC}"
echo -e "${GREEN}✅ CRUD operations tested${NC}"
echo -e "${GREEN}✅ Multiple notification types tested${NC}"

echo -e "\n${YELLOW}📋 Features tested:${NC}"
echo "  • Notification creation with dynamic content"
echo "  • Notification retrieval"
echo "  • Mark as seen functionality"
echo "  • Delete functionality"
echo "  • Multiple notification types"
echo "  • Dynamic templates with game data"

echo -e "\n${BLUE}💡 Next steps:${NC}"
echo "  • Check your database for created notifications"
echo "  • Test push notifications if Expo tokens are configured"
echo "  • Test email notifications if configured"
echo "  • Test with real mobile app integration"
