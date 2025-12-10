#!/bin/bash

echo "=========================================="
echo "SHUSH Application Diagnostics"
echo "=========================================="

echo ""
echo "1. PM2 Process Status:"
pm2 list

echo ""
echo "2. SHUSH PM2 Details:"
pm2 show shush-blue 2>/dev/null || echo "  shush-blue process not found"
pm2 show shush-green 2>/dev/null || echo "  shush-green process not found"

echo ""
echo "3. Recent Application Logs:"
echo "  Blue logs:"
pm2 logs shush-blue --lines 30 --nostream 2>/dev/null || echo "    No blue deployment"
echo ""
echo "  Green logs:"
pm2 logs shush-green --lines 30 --nostream 2>/dev/null || echo "    No green deployment"

echo ""
echo "4. Port Status:"
echo "  Port 3000 (Blue):"
if command -v lsof > /dev/null 2>&1; then
    lsof -i :3000 || echo "    Nothing listening on port 3000"
elif command -v netstat > /dev/null 2>&1; then
    netstat -tuln | grep 3000 || echo "    Nothing listening on port 3000"
else
    echo "    Cannot check port (lsof/netstat not available)"
fi

echo "  Port 3001 (Green):"
if command -v lsof > /dev/null 2>&1; then
    lsof -i :3001 || echo "    Nothing listening on port 3001"
elif command -v netstat > /dev/null 2>&1; then
    netstat -tuln | grep 3001 || echo "    Nothing listening on port 3001"
else
    echo "    Cannot check port (lsof/netstat not available)"
fi

echo ""
echo "5. Testing Endpoints:"
for port in 3000 3001; do
    echo "  Port $port:"
    for endpoint in "/api/health" "/api" "/admin" "/"; do
        url="http://localhost:$port$endpoint"
        RESPONSE=$(curl -sf "$url" 2>&1)
        if [ $? -eq 0 ]; then
            echo "    ✅ $endpoint responding"
            if [[ "$endpoint" == "/api/health" ]]; then
                echo "       Response: $RESPONSE"
            fi
        else
            echo "    ❌ $endpoint not responding"
        fi
    done
    echo ""
done

echo ""
echo "6. Blue-Green Deployment Status:"
ACTIVE_LINK=$(readlink /home/lando/app/active 2>/dev/null)
if [ -n "$ACTIVE_LINK" ]; then
    ACTIVE_COLOR=$(echo "$ACTIVE_LINK" | grep -o 'blue\|green')
    echo "  Active deployment: $ACTIVE_COLOR"
    echo "  Active symlink: $ACTIVE_LINK"
else
    echo "  ⚠️  No active symlink found"
fi

echo ""
echo "7. Application Directory Structure:"
echo "  Blue:"
ls -la /home/lando/app/blue/ 2>/dev/null | head -10 || echo "    Blue directory not found"
echo ""
echo "  Green:"
ls -la /home/lando/app/green/ 2>/dev/null | head -10 || echo "    Green directory not found"
echo ""
echo "  Active symlink:"
ls -la /home/lando/app/active 2>/dev/null || echo "    Active symlink not found"

echo ""
echo "8. Environment Check:"
if [ -f "/home/lando/repo/.env" ]; then
    echo "  .env file exists in repo"
    echo "  Environment variables (sensitive values hidden):"
    grep -v "SECRET\|PASSWORD\|KEY\|URI\|TOKEN" /home/lando/repo/.env | sed 's/^/    /'
else
    echo "  ⚠️  No .env file found in repo directory!"
fi

echo ""
echo "9. Symlinks Check:"
echo "  Blue .env symlink:"
ls -la /home/lando/app/blue/.env 2>/dev/null || echo "    ⚠️ .env symlink not found"
echo "  Green .env symlink:"
ls -la /home/lando/app/green/.env 2>/dev/null || echo "    ⚠️ .env symlink not found"
echo "  Blue node_modules symlink:"
ls -la /home/lando/app/blue/node_modules 2>/dev/null | head -2 || echo "    ⚠️ node_modules symlink not found"
echo "  Green node_modules symlink:"
ls -la /home/lando/app/green/node_modules 2>/dev/null | head -2 || echo "    ⚠️ node_modules symlink not found"

echo ""
echo "10. Node.js and pnpm versions:"
node --version
pnpm --version

echo ""
echo "11. Disk Usage:"
df -h /home/lando

echo ""
echo "=========================================="
echo "Diagnostics Complete"
echo "=========================================="
