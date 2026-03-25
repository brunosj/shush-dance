#!/bin/bash

set -e
set -x

echo "Starting single-instance SHUSH deployment..."

# Ensure correct Node.js and pnpm are in PATH
export PATH=$HOME/.nvm/versions/node/v22.20.0/bin:$HOME/.local/share/pnpm:$PATH

BASE_DIR="/home/lando"
REPO_DIR="$BASE_DIR/repo"
APP_DIR="$BASE_DIR/app/current"
PM2_NAME="shushv2"
PORT=3000
SHARED_MEDIA_DIR="$BASE_DIR/media"

echo "======================================"
echo "Single Deployment"
echo "App dir: $APP_DIR"
echo "PM2 process: $PM2_NAME"
echo "Port: $PORT"
echo "Media dir: $SHARED_MEDIA_DIR"
echo "======================================"

echo "=========================================="
echo "STEP 1: Prepare Repository"
echo "=========================================="

mkdir -p "$APP_DIR"
mkdir -p "$SHARED_MEDIA_DIR"

cd "$REPO_DIR"

git fetch origin
git reset --hard origin/main

echo "Installing dependencies..."
pnpm install

echo "=========================================="
echo "STEP 2: Build Application"
echo "=========================================="

echo "Building Payload admin and server..."
pnpm run build:payload
pnpm run build:server

echo "Skipping Next.js pre-build (runtime compile mode)"

echo "=========================================="
echo "STEP 3: Sync Runtime Directory"
echo "=========================================="

echo "Preparing runtime directory..."

rm -rf "$APP_DIR/package.json" "$APP_DIR/node_modules" "$APP_DIR/.next" "$APP_DIR/dist" "$APP_DIR/public" "$APP_DIR/build"

echo "Creating symlinks..."
ln -sfn "$REPO_DIR/package.json" "$APP_DIR/package.json"
ln -sfn "$REPO_DIR/node_modules" "$APP_DIR/node_modules"

echo "Copying dist output..."
rsync -av --delete "$REPO_DIR/dist/" "$APP_DIR/dist/"

if [ -d "$REPO_DIR/.next" ]; then
    echo "Copying .next output..."
    rsync -av --delete "$REPO_DIR/.next/" "$APP_DIR/.next/"
else
    echo "No .next directory (Next.js will compile at runtime)"
fi

if [ -d "$REPO_DIR/build" ]; then
    echo "Copying build output..."
    rsync -av --delete "$REPO_DIR/build/" "$APP_DIR/build/"
fi

if [ -d "$REPO_DIR/public" ]; then
    echo "Copying public assets..."
    rsync -av --delete "$REPO_DIR/public/" "$APP_DIR/public/"
fi

echo "Symlinking shared media directory..."
rm -rf "$APP_DIR/media"
ln -sfn "$SHARED_MEDIA_DIR" "$APP_DIR/media"

echo "Copying configuration files..."
for file in next.config.js tailwind.config.js postcss.config.js nodemon.json middleware.ts redirects.js csp.js; do
    if [ -f "$REPO_DIR/$file" ]; then
        cp "$REPO_DIR/$file" "$APP_DIR/"
    fi
done

echo "Symlinking .env from repo..."
rm -f "$APP_DIR/.env"
ln -sfn "$REPO_DIR/.env" "$APP_DIR/.env"

echo "=========================================="
echo "STEP 4: Start Single PM2 Process"
echo "=========================================="

cd "$APP_DIR"

echo "Removing old blue/green processes if present..."
pm2 delete shush-blue 2>/dev/null || true
pm2 delete shush-green 2>/dev/null || true
pm2 delete shushv3 2>/dev/null || true

echo "Starting PM2 process: $PM2_NAME"
pm2 delete "$PM2_NAME" 2>/dev/null || true
MEDIA_DIR="$SHARED_MEDIA_DIR" PORT="$PORT" pm2 start pnpm --name "$PM2_NAME" --cwd "$APP_DIR" -- serve

echo "Waiting for PM2 process to initialize..."
sleep 10

if ! pm2 list | rg "$PM2_NAME.*online" > /dev/null; then
    echo "PM2 process is not online after startup."
    echo "PM2 snapshot:"
    pm2 list
    echo ""
    echo "Process logs (last 120 lines):"
    pm2 logs "$PM2_NAME" --lines 120 --nostream || true
    exit 1
fi

echo "=========================================="
echo "STEP 5: Health Check"
echo "=========================================="

HEALTH_ENDPOINT="http://localhost:$PORT/api/health"
APP_READY=false

echo "Checking health at: $HEALTH_ENDPOINT"

for i in {1..60}; do
  # Try health check endpoint (curl failures are expected until app is ready)
  set +e
  RESPONSE=$(curl -sf "$HEALTH_ENDPOINT" 2>&1)
  CURL_EXIT=$?
  set -e

  if [ $CURL_EXIT -eq 0 ]; then
    echo "Application is ready."
    echo "Health check response: $RESPONSE"
    APP_READY=true
    break
  fi

  # If PM2 process is no longer online, fail immediately with diagnostics.
  if ! pm2 list | rg "$PM2_NAME.*online" > /dev/null; then
    echo "PM2 process went offline during health checks."
    pm2 list
    echo ""
    echo "Process logs (last 120 lines):"
    pm2 logs "$PM2_NAME" --lines 120 --nostream || true
    exit 1
  fi
  
  if [ $i -eq 60 ]; then
    echo "Application failed to respond in time (60 seconds)"
    echo ""
    echo "Testing health endpoint:"
    curl -v "$HEALTH_ENDPOINT" 2>&1 | head -20
    echo ""
    echo "PM2 status:"
    pm2 list
    echo ""
    echo "Application logs (last 50 lines):"
    pm2 logs "$PM2_NAME" --lines 50 --nostream
    exit 1
  fi
  
  if [ $((i % 5)) -eq 0 ]; then
    echo "Waiting for application... (attempt $i/60, ${i}s elapsed)"
  fi
  
  sleep 1
done

if [ "$APP_READY" = false ]; then
    echo "Application did not become ready"
    exit 1
fi

pm2 save

echo "=========================================="
echo "Deployment completed successfully."
echo "=========================================="
echo "Active deployment: $PM2_NAME on port $PORT"
echo "MEDIA_DIR forced to: $SHARED_MEDIA_DIR"
pm2 list
