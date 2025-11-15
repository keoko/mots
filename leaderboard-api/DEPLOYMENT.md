# Deployment Guide - Mots Leaderboard API

## Prerequisites

1. **Install flyctl CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to fly.io**:
   ```bash
   flyctl auth login
   ```

3. **Verify you're logged in**:
   ```bash
   flyctl auth whoami
   ```

## Quick Deploy

Simply run the deployment script:

```bash
cd /home/natxo/dev/mots/leaderboard-api
./deploy.sh
```

The script will:
- ✅ Check if flyctl is installed
- ✅ Check if you're logged in
- ✅ Create the app if it doesn't exist
- ✅ Create a persistent volume for the database
- ✅ Deploy the application
- ✅ Show the app status

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Create the app (first time only)

```bash
flyctl apps create mots-leaderboard
```

### 2. Create persistent volume (first time only)

```bash
flyctl volumes create mots_leaderboard_data \
  --region cdg \
  --size 1 \
  --app mots-leaderboard
```

### 3. Set environment variables (first time only)

```bash
flyctl secrets set NODE_ENV=production --app mots-leaderboard
```

### 4. Deploy

```bash
flyctl deploy --remote-only
```

## Post-Deployment

### Check deployment status

```bash
flyctl status
```

### View logs

```bash
flyctl logs
```

### SSH into the machine

```bash
flyctl ssh console
```

### Test the API

```bash
# Health check
curl https://mots-leaderboard.fly.dev/health

# Get leaderboard
curl https://mots-leaderboard.fly.dev/api/leaderboard/cosmetics

# Submit a score
curl -X POST https://mots-leaderboard.fly.dev/api/leaderboard/cosmetics \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "test-uuid",
    "playerName": "TEST",
    "score": 1000,
    "wordsWon": 10,
    "wordsLost": 0,
    "successRate": 100,
    "time": 45000
  }'
```

## Update Frontend CORS Settings

After deployment, update your frontend to use the production API:

**In `js/leaderboard-api.js`**:
```javascript
const API_BASE_URL = import.meta.env?.MODE === 'production'
  ? 'https://mots-leaderboard.fly.dev/api'
  : 'http://localhost:3000/api';
```

## Monitoring

### View metrics

```bash
flyctl dashboard
```

### Scale machines

```bash
# Scale up
flyctl scale count 2

# Scale down
flyctl scale count 1
```

### View volume usage

```bash
flyctl volumes list
```

## Troubleshooting

### App not starting

Check logs:
```bash
flyctl logs --app mots-leaderboard
```

### Database issues

SSH into the machine and check:
```bash
flyctl ssh console
ls -la /data/
```

### Volume full

Increase volume size:
```bash
flyctl volumes extend <volume-id> --size 2
```

### Reset everything

```bash
flyctl apps destroy mots-leaderboard
flyctl volumes list  # Get volume ID
flyctl volumes destroy <volume-id>
./deploy.sh  # Redeploy from scratch
```

## Configuration Files

- **fly.toml** - Fly.io configuration
- **Dockerfile** - Container build instructions
- **.dockerignore** - Files to exclude from Docker build
- **deploy.sh** - Automated deployment script

## Cost Estimation

- **Free tier**: Includes 3 shared-cpu-1x VMs with 256MB RAM
- **Volume**: 1GB persistent storage (free tier)
- **Bandwidth**: 160GB/month (free tier)

Your setup should fit comfortably within the free tier unless you get massive traffic.

## Important Notes

1. **Auto-stop machines**: The app will automatically stop when idle and restart on request
2. **Database persistence**: All data is stored in the mounted volume at `/data/`
3. **Health checks**: Fly.io checks `/health` endpoint every 30 seconds
4. **CORS**: Configured for production domains in `src/server.js`
5. **Rate limiting**: 100 requests per 15 minutes per IP

## Useful Commands

```bash
# View all apps
flyctl apps list

# View app info
flyctl info

# Restart app
flyctl apps restart

# View secrets
flyctl secrets list

# Set new secret
flyctl secrets set KEY=value

# View current deployment
flyctl releases

# Rollback to previous version
flyctl releases rollback

# Open app in browser
flyctl open

# View billing
flyctl billing
```
