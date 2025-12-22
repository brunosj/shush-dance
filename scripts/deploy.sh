#!/bin/bash

set -e  # Exit on error
set -x  # Print commands

echo "Starting SHUSH deployment process..."

# Ensure correct Node.js and pnpm are in PATH
export PATH=$HOME/.nvm/versions/node/v22.20.0/bin:$HOME/.local/share/pnpm:$PATH

BASE_DIR="/home/lando"
REPO_DIR="$BASE_DIR/repo"
APP_BASE_DIR="$BASE_DIR/app"

# Determine which color to deploy to (alternate between blue and green)
CURRENT_COLOR=$(readlink "$APP_BASE_DIR/active" 2>/dev/null | grep -o 'blue\|green' || echo "green")
if [[ "$CURRENT_COLOR" == "blue" ]]; then
    NEW_COLOR="green"
    NEW_PORT=3001
    OLD_PORT=3000
else
    NEW_COLOR="blue"
    NEW_PORT=3000
    OLD_PORT=3001
fi

APP_DIR="$APP_BASE_DIR/$NEW_COLOR"
PM2_NAME="shush-$NEW_COLOR"
OLD_PM2_NAME="shush-$CURRENT_COLOR"

echo "=========================================="
echo "Blue-Green Deployment"
echo "Current active: $CURRENT_COLOR (port $OLD_PORT)"
echo "Deploying to: $NEW_COLOR (port $NEW_PORT)"
echo "=========================================="

echo "=========================================="
echo "STEP 1: Prepare Repository"
echo "=========================================="

# Ensure base directory structure exists
mkdir -p "$APP_BASE_DIR"/{blue,green}

cd "$REPO_DIR"

# Pull latest changes
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo "=========================================="
echo "STEP 2: Build Application (without SSG)"
echo "=========================================="

# Build without Next.js SSG (no database connection needed)
echo "📦 Building Payload admin and server..."
pnpm run build:payload
pnpm run build:server

# Note: Skipping build:next (Next.js will compile on-demand at runtime)
echo "ℹ️  Skipping Next.js pre-build (SSG not needed)"

echo "=========================================="
echo "STEP 3: Deploy to $NEW_COLOR Environment"
echo "=========================================="

echo "📁 Preparing $NEW_COLOR directory..."

# Remove old symlinks/files if they exist
rm -rf "$APP_DIR/package.json" "$APP_DIR/node_modules" "$APP_DIR/.next" "$APP_DIR/dist" "$APP_DIR/public" "$APP_DIR/build"

# Symlink package.json
echo "🔗 Creating symlinks..."
ln -sfn "$REPO_DIR/package.json" "$APP_DIR/package.json"

# Symlink node_modules to avoid duplicating dependencies
ln -sfn "$REPO_DIR/node_modules" "$APP_DIR/node_modules"

# Copy the dist build output (TypeScript server)
echo "📁 Copying dist output..."
rsync -av --delete "$REPO_DIR/dist/" "$APP_DIR/dist/"

# Copy the .next build output (Next.js) if it exists
if [ -d "$REPO_DIR/.next" ]; then
    echo "📁 Copying .next output..."
    rsync -av --delete "$REPO_DIR/.next/" "$APP_DIR/.next/"
else
    echo "ℹ️  No .next directory (Next.js will compile at runtime)"
fi

# Copy the build directory (Payload admin)
if [ -d "$REPO_DIR/build" ]; then
    echo "📁 Copying build output..."
    rsync -av --delete "$REPO_DIR/build/" "$APP_DIR/build/"
fi

# Copy public assets
if [ -d "$REPO_DIR/public" ]; then
    echo "📁 Copying public assets..."
    rsync -av --delete "$REPO_DIR/public/" "$APP_DIR/public/"
fi

# Symlink shared media directory (persistent across deployments)
SHARED_MEDIA_DIR="$BASE_DIR/media"
mkdir -p "$SHARED_MEDIA_DIR"
echo "🔗 Symlinking shared media directory..."
rm -rf "$APP_DIR/media"
ln -sfn "$SHARED_MEDIA_DIR" "$APP_DIR/media"

# Copy configuration files from repo
echo "📁 Copying configuration files..."
for file in next.config.js tailwind.config.js postcss.config.js nodemon.json middleware.ts redirects.js csp.js; do
    if [ -f "$REPO_DIR/$file" ]; then
        cp "$REPO_DIR/$file" "$APP_DIR/"
    fi
done

# Symlink .env from repo (not copy, so changes in repo are reflected)
echo "🔗 Symlinking .env from repo..."
rm -f "$APP_DIR/.env"
ln -sfn "$REPO_DIR/.env" "$APP_DIR/.env"

echo "=========================================="
echo "STEP 4: Start $NEW_COLOR PM2 Process"
echo "=========================================="

cd "$APP_DIR"

# Determine the serve command based on color
if [ "$NEW_COLOR" = "green" ]; then
    SERVE_CMD="pnpm serve-green"
else
    SERVE_CMD="pnpm serve"
fi

echo "🚀 Starting PM2 process: $PM2_NAME ($SERVE_CMD)"

# Check if process already exists
if pm2 list | grep -q "$PM2_NAME"; then
    echo "🔄 Restarting existing PM2 process..."
    pm2 restart "$PM2_NAME" || {
        echo "⚠️  Restart failed, deleting and recreating process..."
        pm2 delete "$PM2_NAME" || true
        pm2 start "$SERVE_CMD" --name "$PM2_NAME"
    }
else
    echo "🆕 Creating new PM2 process..."
    pm2 start "$SERVE_CMD" --name "$PM2_NAME"
fi

# Verify PM2 started successfully
echo "⏳ Waiting for PM2 process to initialize..."
sleep 10

if ! pm2 list | grep -q "$PM2_NAME.*online"; then
    echo "❌ PM2 process failed to start!"
    echo "Checking logs..."
    pm2 logs "$PM2_NAME" --lines 50 --nostream
    exit 1
fi

echo "✅ PM2 process is online"

echo "=========================================="
echo "STEP 5: Health Check $NEW_COLOR"
echo "=========================================="

HEALTH_ENDPOINT="http://localhost:$NEW_PORT/api/health"
APP_READY=false

echo "Checking health at: $HEALTH_ENDPOINT"

for i in {1..60}; do
  # Try health check endpoint
  RESPONSE=$(curl -sf "$HEALTH_ENDPOINT" 2>&1)
  if [ $? -eq 0 ]; then
    echo "✅ $NEW_COLOR application is ready!"
    echo "   Health check response: $RESPONSE"
    APP_READY=true
    break
  fi
  
  if [ $i -eq 60 ]; then
    echo "❌ $NEW_COLOR application failed to respond in time (60 seconds)"
    echo ""
    echo "Testing health endpoint:"
    curl -v "$HEALTH_ENDPOINT" 2>&1 | head -20
    echo ""
    echo "PM2 status:"
    pm2 list
    echo ""
    echo "Application logs (last 50 lines):"
    pm2 logs "$PM2_NAME" --lines 50 --nostream
    echo ""
    echo "💡 Keeping old deployment active. Run diagnostics: bash scripts/diagnose.sh"
    exit 1
  fi
  
  # Show progress every 5 attempts
  if [ $((i % 5)) -eq 0 ]; then
    echo "Waiting for $NEW_COLOR application... (attempt $i/60, ${i}s elapsed)"
  fi
  
  sleep 1
done

if [ "$APP_READY" = false ]; then
    echo "❌ $NEW_COLOR application did not become ready"
    exit 1
fi

echo "=========================================="
echo "STEP 6: Switch Active Deployment"
echo "=========================================="

echo "🔄 Switching active symlink from $CURRENT_COLOR to $NEW_COLOR..."

# Update the active symlink
rm -f "$APP_BASE_DIR/active"
ln -sfn "$APP_BASE_DIR/$NEW_COLOR" "$APP_BASE_DIR/active"

echo "✅ Active symlink now points to $NEW_COLOR"
echo ""
echo "ℹ️  Caddy will automatically route traffic to the healthy port"
echo "   Both ports (3000-3001) are in the load balancer pool"
echo ""

# Wait a bit to ensure Caddy detects the new healthy port
echo "⏳ Waiting 10 seconds for Caddy to detect healthy deployment..."
sleep 10

echo "=========================================="
echo "STEP 7: Stop Old Deployment"
echo "=========================================="

if pm2 list | grep -q "$OLD_PM2_NAME"; then
    echo "🛑 Stopping old deployment: $OLD_PM2_NAME"
    pm2 stop "$OLD_PM2_NAME" || true
    pm2 delete "$OLD_PM2_NAME" || true
    echo "✅ Old deployment stopped and removed"
else
    echo "ℹ️  No old deployment to stop"
fi

# Save PM2 process list
pm2 save

echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "=========================================="
echo "Active deployment: $NEW_COLOR on port $NEW_PORT"
echo "Previous deployment: $CURRENT_COLOR (stopped)"
echo ""
pm2 list
