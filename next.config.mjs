import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { withPayload } from '@payloadcms/next/withPayload';

const require = createRequire(import.meta.url);
const redirects = require('./redirects.cjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function originFromEnvUrl(envUrl) {
  if (!envUrl) return null;

  try {
    const normalized = envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
    const parsed = new URL(normalized);
    return {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || undefined,
    };
  } catch {
    return null;
  }
}

const mediaOrigin = originFromEnvUrl(process.env.NEXT_PUBLIC_MEDIA_URL);
const payloadOrigin = originFromEnvUrl(process.env.NEXT_PUBLIC_PAYLOAD_URL);

const remotePatterns = [];

if (mediaOrigin) {
  remotePatterns.push({
    protocol: mediaOrigin.protocol,
    hostname: mediaOrigin.hostname,
    ...(mediaOrigin.port ? { port: mediaOrigin.port } : {}),
    pathname: '/**',
  });
}

if (
  payloadOrigin &&
  (!mediaOrigin || payloadOrigin.hostname !== mediaOrigin.hostname)
) {
  remotePatterns.push({
    protocol: payloadOrigin.protocol,
    hostname: payloadOrigin.hostname,
    ...(payloadOrigin.port ? { port: payloadOrigin.port } : {}),
    pathname: '/**',
  });
}

remotePatterns.push({
  protocol: 'http',
  hostname: 'localhost',
  port: '3000',
  pathname: '/media/**',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: Boolean(process.env.NEXT_PUBLIC_MEDIA_URL),
    remotePatterns,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/media/**',
      },
    ],
  },
  redirects,
  async headers() {
    const headers = [];

    if (!process.env.NEXT_PUBLIC_IS_LIVE) {
      headers.push({
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
        ],
        source: '/:path*',
      });
    }

    return headers;
  },
  env: {
    NEXT_PUBLIC_BANDCAMP_CLIENT_ID: process.env.NEXT_PUBLIC_BANDCAMP_CLIENT_ID,
    BANDCAMP_CLIENT_SECRET: process.env.BANDCAMP_CLIENT_SECRET,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });