#!/bin/bash

# Quick rollback script - switches back to the previous deployment

set -e

BASE_DIR="/home/lando"
APP_BASE_DIR="$BASE_DIR/app"

# Get current active color
CURRENT_COLOR=$(readlink "$APP_BASE_DIR/active" 2>/dev/null | grep -o 'blue\|green' || echo "none")

if [ "$CURRENT_COLOR" = "none" ]; then
    echo "❌ No active deployment found"
    exit 1
fi

# Determine the previous color
if [ "$CURRENT_COLOR" = "blue" ]; then
    PREVIOUS_COLOR="green"
    PREVIOUS_PORT=3001
    CURRENT_PORT=3000
else
    PREVIOUS_COLOR="blue"
    PREVIOUS_PORT=3000
    CURRENT_PORT=3001
fi

echo "=========================================="
echo "🔙 ROLLBACK"
echo "=========================================="
echo "Current active: $CURRENT_COLOR (port $CURRENT_PORT)"
echo "Rolling back to: $PREVIOUS_COLOR (port $PREVIOUS_PORT)"
echo ""

# Check if previous deployment exists
if [ ! -d "$APP_BASE_DIR/$PREVIOUS_COLOR" ]; then
    echo "❌ Previous deployment ($PREVIOUS_COLOR) does not exist"
    exit 1
fi

# Check if previous is running, if not start it
PREVIOUS_PM2="shush-$PREVIOUS_COLOR"
if ! pm2 list | grep -q "$PREVIOUS_PM2.*online"; then
    echo "⚠️  Previous deployment is not running, starting it..."
    cd "$APP_BASE_DIR/$PREVIOUS_COLOR"
    PORT="$PREVIOUS_PORT" NODE_ENV=production pm2 start "pnpm run serve" \
        --name "$PREVIOUS_PM2" \
        --cwd "$APP_BASE_DIR/$PREVIOUS_COLOR"
    
    echo "⏳ Waiting for startup..."
    sleep 5
fi

# Health check
HEALTH_ENDPOINT="http://localhost:$PREVIOUS_PORT/api/health"
echo "🔍 Checking health of $PREVIOUS_COLOR..."

HEALTH_OK=false
for i in {1..30}; do
    if curl -sf "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
        HEALTH_OK=true
        break
    fi
    if [ $((i % 5)) -eq 0 ]; then
        echo "   Waiting for health check... ($i/30)"
    fi
    sleep 1
done

if [ "$HEALTH_OK" = false ]; then
    echo "❌ Previous deployment is not healthy"
    echo "   Health check failed: $HEALTH_ENDPOINT"
    echo ""
    echo "Cannot rollback to unhealthy deployment!"
    exit 1
fi

echo "✅ Previous deployment is healthy"
echo ""

# Switch
echo "🔄 Switching active symlink back to $PREVIOUS_COLOR..."
rm -f "$APP_BASE_DIR/active"
ln -sfn "$APP_BASE_DIR/$PREVIOUS_COLOR" "$APP_BASE_DIR/active"

echo "✅ Active symlink switched to $PREVIOUS_COLOR"
echo ""
echo "ℹ️  Caddy will automatically route to port $PREVIOUS_PORT"
echo "   Waiting 10 seconds for Caddy to detect rollback..."
sleep 10

# Stop current
CURRENT_PM2="shush-$CURRENT_COLOR"
if pm2 list | grep -q "$CURRENT_PM2"; then
    echo "🛑 Stopping $CURRENT_PM2..."
    pm2 stop "$CURRENT_PM2"
    pm2 delete "$CURRENT_PM2"
fi

pm2 save

echo ""
echo "=========================================="
echo "✅ Rollback completed!"
echo "=========================================="
echo "Active: $PREVIOUS_COLOR (port $PREVIOUS_PORT)"
echo "Stopped: $CURRENT_COLOR"
echo ""
pm2 list

