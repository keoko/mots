# Mots Leaderboard API

Global leaderboard backend for the Mots vocabulary trainer.

## Setup

### Local Development

```bash
# Install dependencies
npm install

# Start server (development mode with auto-reload)
npm run dev

# Start server (production mode)
npm start
```

The API will run on `http://localhost:3000`

### Test the API

```bash
# Get top 10 scores for a topic
curl http://localhost:3000/api/leaderboard/test-animals

# Submit a score
curl -X POST http://localhost:3000/api/leaderboard/test-animals \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "ALICE",
    "score": 1500,
    "wordsWon": 10,
    "wordsLost": 2,
    "successRate": 83,
    "time": 45000
  }'
```

## Deploy to Fly.io

### Prerequisites
- Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/)
- Sign up at https://fly.io

### Deployment Steps

```bash
# Login to Fly.io
fly auth login

# Launch the app (first time only)
fly launch --no-deploy

# Create persistent volume for SQLite database
fly volumes create mots_leaderboard_data --region mad --size 1

# Deploy the app
fly deploy

# Check status
fly status

# View logs
fly logs

# Open in browser
fly open
```

### Environment Variables

Set in production:
```bash
fly secrets set NODE_ENV=production
```

## API Endpoints

### GET /api/leaderboard/:topicId

Get top 10 scores for a topic.

**Response:**
```json
{
  "topicId": "test-animals",
  "scores": [
    {
      "id": 1,
      "playerName": "ALICE",
      "score": 1500,
      "wordsWon": 10,
      "wordsLost": 2,
      "successRate": 83,
      "time": 45000,
      "date": "2025-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/leaderboard/:topicId

Submit a new score.

**Request:**
```json
{
  "playerName": "ALICE",
  "score": 1500,
  "wordsWon": 10,
  "wordsLost": 2,
  "successRate": 83,
  "time": 45000
}
```

**Response:**
```json
{
  "id": 123,
  "rank": 3,
  "madeTopTen": true,
  "topScores": [...]
}
```

## Database Schema

```sql
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  words_won INTEGER NOT NULL,
  words_lost INTEGER NOT NULL,
  success_rate INTEGER NOT NULL,
  time INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Applies to all `/api/*` endpoints

## CORS

Production allows:
- `https://keoko.github.io`
- `https://mots.fly.dev`

Development allows all origins.
