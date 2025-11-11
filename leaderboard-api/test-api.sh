#!/bin/bash

# Mots Leaderboard API Test Script
# Run this after starting the server with: npm run dev

set -e

API_URL="http://localhost:3000"
TOPIC="test-animals"

echo "🧪 Testing Mots Leaderboard API"
echo "================================"
echo ""

# Check if server is running
echo "1️⃣  Checking if server is running..."
if ! curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/leaderboard/$TOPIC" | grep -q "200"; then
    echo "❌ Server is not running on $API_URL"
    echo "   Start it with: npm run dev"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Get initial leaderboard (should be empty or have existing data)
echo "2️⃣  Getting initial leaderboard for topic: $TOPIC"
echo "GET $API_URL/api/leaderboard/$TOPIC"
curl -s "$API_URL/api/leaderboard/$TOPIC" | jq '.'
echo ""
echo ""

# Submit test scores
echo "3️⃣  Submitting test scores..."
echo ""

echo "   📝 Submitting score for ALICE (1500 points)..."
RESPONSE=$(curl -s -X POST "$API_URL/api/leaderboard/$TOPIC" \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "ALICE",
    "score": 1500,
    "wordsWon": 10,
    "wordsLost": 2,
    "successRate": 83,
    "time": 45000
  }')
echo "$RESPONSE" | jq '.'
echo ""

echo "   📝 Submitting score for BOB (1800 points)..."
RESPONSE=$(curl -s -X POST "$API_URL/api/leaderboard/$TOPIC" \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "BOB",
    "score": 1800,
    "wordsWon": 12,
    "wordsLost": 0,
    "successRate": 100,
    "time": 30000
  }')
echo "$RESPONSE" | jq '.'
echo ""

echo "   📝 Submitting score for CAROL (1200 points)..."
RESPONSE=$(curl -s -X POST "$API_URL/api/leaderboard/$TOPIC" \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "CAROL",
    "score": 1200,
    "wordsWon": 8,
    "wordsLost": 4,
    "successRate": 67,
    "time": 60000
  }')
echo "$RESPONSE" | jq '.'
echo ""

echo "   📝 Submitting score for DAVID (2000 points)..."
RESPONSE=$(curl -s -X POST "$API_URL/api/leaderboard/$TOPIC" \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "DAVID",
    "score": 2000,
    "wordsWon": 15,
    "wordsLost": 0,
    "successRate": 100,
    "time": 25000
  }')
echo "$RESPONSE" | jq '.'
echo ""

echo "   📝 Submitting score for EVE (900 points)..."
RESPONSE=$(curl -s -X POST "$API_URL/api/leaderboard/$TOPIC" \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "EVE",
    "score": 900,
    "wordsWon": 6,
    "wordsLost": 6,
    "successRate": 50,
    "time": 75000
  }')
echo "$RESPONSE" | jq '.'
echo ""

# Get final leaderboard
echo "4️⃣  Getting updated leaderboard..."
echo "GET $API_URL/api/leaderboard/$TOPIC"
FINAL=$(curl -s "$API_URL/api/leaderboard/$TOPIC")
echo "$FINAL" | jq '.'
echo ""

# Verify results
echo "5️⃣  Verifying results..."
SCORES_COUNT=$(echo "$FINAL" | jq '.scores | length')
TOP_PLAYER=$(echo "$FINAL" | jq -r '.scores[0].playerName')
TOP_SCORE=$(echo "$FINAL" | jq -r '.scores[0].score')

echo "   Total scores returned: $SCORES_COUNT"
echo "   Top player: $TOP_PLAYER with $TOP_SCORE points"

if [ "$TOP_PLAYER" = "DAVID" ] && [ "$TOP_SCORE" = "2000" ]; then
    echo "   ✅ Leaderboard is correctly sorted!"
else
    echo "   ⚠️  Unexpected results - check the output above"
fi
echo ""

echo "✅ API tests completed successfully!"
echo ""
echo "💡 Tip: You can test with different topics by changing the TOPIC variable"
echo "   Example: TOPIC=colors ./test-api.sh"
