#!/bin/bash

# Script to manually switch between blue and green deployments

set -e

BASE_DIR="/home/lando"
APP_BASE_DIR="$BASE_DIR/app"

# Get current active color
CURRENT_COLOR=$(readlink "$APP_BASE_DIR/active" 2>/dev/null | grep -o 'blue\|green' || echo "none")

if [ "$CURRENT_COLOR" = "none" ]; then
    echo "❌ No active deployment found"
    echo "Available deployments:"
    ls -la "$APP_BASE_DIR"
    exit 1
fi

# Determine the other color
if [ "$CURRENT_COLOR" = "blue" ]; then
    TARGET_COLOR="green"
    TARGET_PORT=3001
    CURRENT_PORT=3000
else
    TARGET_COLOR="blue"
    TARGET_PORT=3000
    CURRENT_PORT=3001
fi

echo "=========================================="
echo "Switch Active Deployment"
echo "=========================================="
echo "Current active: $CURRENT_COLOR (port $CURRENT_PORT)"
echo "Target: $TARGET_COLOR (port $TARGET_PORT)"
echo ""

# Check if target deployment exists and is healthy
if [ ! -d "$APP_BASE_DIR/$TARGET_COLOR" ]; then
    echo "❌ Target deployment ($TARGET_COLOR) does not exist"
    exit 1
fi

# Check if target is running
TARGET_PM2="shush-$TARGET_COLOR"
if ! pm2 list | grep -q "$TARGET_PM2.*online"; then
    echo "❌ Target deployment ($TARGET_COLOR) is not running in PM2"
    echo ""
    echo "Start it first with:"
    echo "  cd $APP_BASE_DIR/$TARGET_COLOR"
    echo "  PORT=$TARGET_PORT NODE_ENV=production pm2 start 'pnpm run serve' --name $TARGET_PM2 --cwd $APP_BASE_DIR/$TARGET_COLOR"
    exit 1
fi

# Health check
HEALTH_ENDPOINT="http://localhost:$TARGET_PORT/api/health"
echo "🔍 Checking health of $TARGET_COLOR..."
if ! curl -sf "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
    echo "❌ Target deployment is not healthy"
    echo "   Health check failed: $HEALTH_ENDPOINT"
    exit 1
fi

echo "✅ Target deployment is healthy"
echo ""

# Confirm switch
read -p "Switch active deployment from $CURRENT_COLOR to $TARGET_COLOR? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🔄 Switching active symlink..."
rm -f "$APP_BASE_DIR/active"
ln -sfn "$APP_BASE_DIR/$TARGET_COLOR" "$APP_BASE_DIR/active"

echo "✅ Active symlink switched to $TARGET_COLOR"
echo ""
echo "ℹ️  Caddy will automatically route to port $TARGET_PORT"
echo "   No proxy configuration update needed"
echo ""

read -p "Stop the old deployment ($CURRENT_COLOR)? (yes/no): " STOP_OLD
if [ "$STOP_OLD" = "yes" ]; then
    CURRENT_PM2="shush-$CURRENT_COLOR"
    echo "🛑 Stopping $CURRENT_PM2..."
    pm2 stop "$CURRENT_PM2"
    pm2 delete "$CURRENT_PM2"
    pm2 save
    echo "✅ Old deployment stopped"
else
    echo "ℹ️  Old deployment still running (can be used for quick rollback)"
fi

echo ""
echo "=========================================="
echo "✅ Switch completed!"
echo "=========================================="
pm2 list

