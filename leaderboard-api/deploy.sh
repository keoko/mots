#!/bin/bash
# deploy.sh - Deploy Mots Leaderboard API to fly.io

set -e  # Exit on error

echo "🚀 Deploying Mots Leaderboard API to fly.io..."
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed"
    echo "Install with: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Not logged in to fly.io"
    echo "Please run: flyctl auth login"
    exit 1
fi

# Check if app exists
APP_NAME="mots-leaderboard"
if flyctl apps list | grep -q "$APP_NAME"; then
    echo "✓ App '$APP_NAME' exists"
    EXISTING_APP=true
else
    echo "⚠️  App '$APP_NAME' does not exist - will create it"
    EXISTING_APP=false
fi

# If app doesn't exist, create it
if [ "$EXISTING_APP" = false ]; then
    echo ""
    echo "📦 Creating new fly.io app..."
    flyctl apps create "$APP_NAME"

    echo ""
    echo "💾 Creating persistent volume for database..."
    flyctl volumes create mots_leaderboard_data \
        --region cdg \
        --size 1 \
        --app "$APP_NAME"

    echo ""
    echo "🔧 Setting environment variables..."
    flyctl secrets set NODE_ENV=production --app "$APP_NAME"
fi

# Deploy the app
echo ""
echo "🚢 Deploying application..."
flyctl deploy --remote-only

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
flyctl status

echo ""
echo "📊 View your app at: https://$APP_NAME.fly.dev"
echo "🏥 Health check: https://$APP_NAME.fly.dev/health"
echo "📝 View logs: flyctl logs"
echo "💻 SSH into app: flyctl ssh console"
