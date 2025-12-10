# Blue-Green Deployment Guide

This document explains the blue-green deployment setup for SHUSH.

## Overview

Blue-green deployment allows zero-downtime deployments by maintaining two parallel production environments:

- **Blue** environment (port 3000)
- **Green** environment (port 3001)

Only one environment is active at a time, serving live traffic. The other is idle or being updated.

## Directory Structure

```
/home/lando/
├── repo/                    # Git repository
│   ├── .env                # Environment variables (shared)
│   └── ...
└── app/
    ├── blue/               # Blue deployment
    │   ├── .env → /home/lando/repo/.env
    │   ├── node_modules → /home/lando/repo/node_modules
    │   ├── package.json → /home/lando/repo/package.json
    │   ├── dist/           # Compiled server
    │   ├── .next/          # Next.js build
    │   ├── build/          # Payload admin
    │   └── ...
    ├── green/              # Green deployment
    │   └── ... (same structure)
    └── active → blue/      # Symlink to active deployment
```

## Caddy Load Balancer Setup

Your Caddy configuration automatically handles failover between blue and green:

```caddy
shush.dance {
    reverse_proxy 127.0.0.1:3000-3001 {
        fail_duration 5s
        lb_try_duration 5s
        lb_policy first
    }
}
```

**How it works:**

- `lb_policy first`: Routes to the first available healthy port (3000, then 3001)
- `fail_duration 5s`: Marks a port as unhealthy after 5s of failures
- `lb_try_duration 5s`: Switches to backup port within 5s
- **No manual proxy updates needed!** Caddy automatically detects which port is healthy

## Deployment Flow

1. **Determine target**: Script checks which color is currently active and deploys to the other
2. **Build**: Application is built in `/home/lando/repo`
3. **Deploy to target**: Files are copied/symlinked to target color directory
4. **Start target**: PM2 starts the new deployment on its designated port
5. **Health check**: Waits up to 60s for health endpoint to respond
6. **Switch active**: Updates `active` symlink to point to new deployment
7. **Stop old**: Stops the old PM2 process
8. **Caddy failover**: Caddy automatically detects the healthy port and routes traffic there

### Zero-Downtime Guarantee

During deployment:

1. Blue (3000) serves traffic
2. Green (3001) starts up and becomes healthy
3. Caddy still routes to Blue (3000)
4. Blue stops → Caddy immediately fails over to Green (3001) within 5s
5. Total downtime: **< 5 seconds** (Caddy's fail_duration)

## Scripts

### Automatic Deployment

```bash
# Runs via GitHub Actions or manually
bash scripts/deploy.sh
```

This automatically:

- Alternates between blue and green
- Builds and deploys
- Health checks the new deployment
- Switches active symlink
- Stops the old deployment
- **No proxy updates needed** - Caddy handles it!

### Manual Switch

```bash
# Switch from current to other color
bash scripts/switch-active.sh
```

Use this to manually switch between deployments without building.

### Rollback

```bash
# Quick rollback to previous deployment
bash scripts/rollback.sh
```

Instantly switches back to the previous color (if still deployed).

### Diagnostics

```bash
# Check status of both deployments
bash scripts/diagnose.sh
```

Shows PM2 status, health checks, ports, and directory structure.

## PM2 Process Names

- **Blue**: `shush-blue` (port 3000)
- **Green**: `shush-green` (port 3001)

Only one runs at a time (unless during deployment transition).

## Health Check

Both deployments expose a health check endpoint:

```bash
# Blue
curl http://localhost:3000/api/health

# Green
curl http://localhost:3001/api/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "shush-dance",
  "version": "2.0.0"
}
```

Caddy uses HTTP requests to determine health. If a port returns errors or doesn't respond, Caddy marks it as unhealthy and fails over.

## Troubleshooting

### Deployment fails health check

1. Check PM2 logs:

   ```bash
   pm2 logs shush-blue
   pm2 logs shush-green
   ```

2. Run diagnostics:

   ```bash
   bash scripts/diagnose.sh
   ```

3. Check if port is available:

   ```bash
   lsof -i :3000
   lsof -i :3001
   ```

4. Test Caddy routing:
   ```bash
   curl -v https://shush.dance/api/health
   ```

### Need to rollback quickly

```bash
bash scripts/rollback.sh
```

This switches back to the previous deployment immediately. Caddy will automatically route to the healthy port.

### Both deployments broken

1. Check the repo build:

   ```bash
   cd /home/lando/repo
   pnpm build
   ```

2. Manually start one:

   ```bash
   cd /home/lando/app/blue
   PORT=3000 NODE_ENV=production pm2 start "pnpm run serve" --name shush-blue
   ```

3. Update active symlink:

   ```bash
   ln -sfn /home/lando/app/blue /home/lando/app/active
   ```

4. Caddy will automatically detect the healthy port

### Caddy not routing correctly

1. Check Caddy logs:

   ```bash
   sudo journalctl -u caddy -n 50
   ```

2. Test both ports directly:

   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:3001/api/health
   ```

3. Restart Caddy if needed:
   ```bash
   sudo systemctl restart caddy
   ```

### Old deployment won't stop

```bash
pm2 stop shush-blue
pm2 delete shush-blue
pm2 stop shush-green
pm2 delete shush-green
pm2 save
```

## Maintenance

### Clean up old builds

Both blue and green share:

- `node_modules` (symlinked from repo)
- `.env` (symlinked from repo)
- `package.json` (symlinked from repo)

Only the build artifacts (`.next`, `dist`, `build`) are duplicated.

To save space, you can remove the inactive deployment's build artifacts:

```bash
# If blue is active, clean green
rm -rf /home/lando/app/green/.next
rm -rf /home/lando/app/green/dist
rm -rf /home/lando/app/green/build
```

### Database migrations

Since both deployments share the same database, run migrations manually before deploying:

```bash
cd /home/lando/repo
# Run your migration commands here
```

## Monitoring with Caddy

Caddy's load balancer provides automatic health checking. You can monitor which backend is active:

```bash
# Check Caddy's upstream status (if you have admin API enabled)
curl http://localhost:2019/config/apps/http/servers

# Or check via logs
sudo journalctl -u caddy -f | grep -i upstream
```

## Advantages of This Setup

1. **Zero manual proxy updates**: Caddy automatically detects healthy backends
2. **Fast failover**: < 5 seconds to switch to healthy port
3. **Automatic recovery**: If a deployment crashes, Caddy routes to the other one
4. **Simple configuration**: Just define the port range (3000-3001)
5. **Built-in health checks**: No need for external monitoring for failover

## Security Notes

1. **Environment variables**: Shared via symlink from repo `.env`
2. **Secrets**: Never commit secrets to git, only store in `.env`
3. **Media files**: Consider using shared media storage or CDN
4. **Database**: Both deployments use the same database
5. **Caddy HTTPS**: Automatic SSL/TLS certificate management

## GitHub Actions

The deployment workflow (`.github/workflows/deploy.yml`) automatically:

1. Connects via SSH
2. Pulls latest code
3. Runs `scripts/deploy.sh`
4. Verifies deployment health
5. Shows final status
6. **Caddy handles traffic routing automatically**

On failure, sends alert via Resend.

## First-Time Setup

1. **Create directory structure**:

   ```bash
   mkdir -p /home/lando/app/{blue,green}
   ```

2. **Make scripts executable**:

   ```bash
   cd /home/lando/repo
   chmod +x scripts/*.sh
   ```

3. **First deployment** (creates initial blue):

   ```bash
   bash scripts/deploy.sh
   ```

4. **Verify Caddy config** is in place:

   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   ```

5. **Test health checks**:
   ```bash
   curl https://shush.dance/api/health
   ```

That's it! Subsequent deployments will automatically alternate between blue and green.
