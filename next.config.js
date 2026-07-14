/** @type {import('next').NextConfig} */
const ContentSecurityPolicy = require('./csp');
const redirects = require('./redirects');

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

const nextConfig = {
  // need to see how this can properly work with the current setup
  // https://nextjs.org/docs/app/api-reference/next-config-js/output
  // output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    // When dev loads media from a remote host, skip server-side optimization to
    // avoid fetchExternalImage timeouts against production.
    unoptimized: Boolean(process.env.NEXT_PUBLIC_MEDIA_URL),
    remotePatterns,
  },

  redirects,
  async headers() {
    const headers = [];

    // Prevent search engines from indexing the site if it is not live
    // This is useful for staging environments before they are ready to go live
    // To allow robots to crawl the site, use the `NEXT_PUBLIC_IS_LIVE` env variable
    // You may want to also use this variable to conditionally render any tracking scripts
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

    // Set the `Content-Security-Policy` header as a security measure to prevent XSS attacks
    // It works by explicitly whitelisting trusted sources of content for your website
    // This will block all inline scripts and styles except for those that are allowed
    // headers.push({
    //   source: '/(.*)',
    //   headers: [
    //     {
    //       key: 'Content-Security-Policy',
    //       value: ContentSecurityPolicy,
    //     },
    //   ],
    // })

    return headers;
  },
  env: {
    NEXT_PUBLIC_BANDCAMP_CLIENT_ID: process.env.NEXT_PUBLIC_BANDCAMP_CLIENT_ID,
    BANDCAMP_CLIENT_SECRET: process.env.BANDCAMP_CLIENT_SECRET,
  },
};

module.exports = nextConfig;
