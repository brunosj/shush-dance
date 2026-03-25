#!/bin/bash

set -e
set -x

echo "Starting SHUSH deployment..."

export PATH=$HOME/.nvm/versions/node/v22.20.0/bin:$HOME/.local/share/pnpm:$PATH

REPO_DIR="/home/lando/repo"
PM2_NAME="shushv2"
SHARED_MEDIA_DIR="/home/lando/media"

cd "$REPO_DIR"

echo "=========================================="
echo "STEP 1: Pull & Install"
echo "=========================================="

git fetch origin
git reset --hard origin/main

pnpm install

echo "=========================================="
echo "STEP 2: Build"
echo "=========================================="

pnpm run build:payload
pnpm run build:server

echo "=========================================="
echo "STEP 3: Ensure media symlink"
echo "=========================================="

mkdir -p "$SHARED_MEDIA_DIR"
rm -rf "$REPO_DIR/media"
ln -sfn "$SHARED_MEDIA_DIR" "$REPO_DIR/media"

echo "=========================================="
echo "STEP 4: Restart PM2"
echo "=========================================="

pm2 delete shush-blue 2>/dev/null || true
pm2 delete shush-green 2>/dev/null || true
pm2 delete shushv3 2>/dev/null || true
pm2 delete "$PM2_NAME" 2>/dev/null || true

pm2 start pnpm --name "$PM2_NAME" --cwd "$REPO_DIR" -- serve

echo "Waiting for process to initialize..."
sleep 15

if ! pm2 list | grep -q "$PM2_NAME.*online"; then
    echo "PM2 process is not online."
    pm2 list
    pm2 logs "$PM2_NAME" --lines 80 --nostream || true
    exit 1
fi

echo "=========================================="
echo "STEP 5: Health Check"
echo "=========================================="

HEALTH_ENDPOINT="http://localhost:3000/api/health"
APP_READY=false

for i in {1..90}; do
  set +e
  RESPONSE=$(curl -sf "$HEALTH_ENDPOINT" 2>&1)
  CURL_EXIT=$?
  set -e

  if [ $CURL_EXIT -eq 0 ]; then
    echo "Application is ready: $RESPONSE"
    APP_READY=true
    break
  fi

  if ! pm2 list | grep -q "$PM2_NAME.*online"; then
    echo "PM2 process crashed."
    pm2 logs "$PM2_NAME" --lines 80 --nostream || true
    exit 1
  fi

  if [ $i -eq 90 ]; then
    echo "Timed out after 90s."
    pm2 logs "$PM2_NAME" --lines 80 --nostream || true
    exit 1
  fi

  if [ $((i % 10)) -eq 0 ]; then
    echo "Waiting... ($i/90s)"
  fi

  sleep 1
done

if [ "$APP_READY" = false ]; then
    echo "Application did not become ready"
    exit 1
fi

pm2 save

echo "=========================================="
echo "Deployed successfully."
echo "=========================================="
pm2 list
