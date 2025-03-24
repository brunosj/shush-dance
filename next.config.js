/** @type {import('next').NextConfig} */
const ContentSecurityPolicy = require('./csp');
const redirects = require('./redirects');

const nextConfig = {
  // need to see how this can properly work with the current setup
  // https://nextjs.org/docs/app/api-reference/next-config-js/output
  // output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_PAYLOAD_URL?.replace(
          /https?:\/\//,
          ''
        ),
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/media/**',
      },
    ],
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
