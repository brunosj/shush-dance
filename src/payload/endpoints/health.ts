import type { Endpoint } from 'payload';

export const healthEndpoint: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req) => {
    try {
      return Response.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'shush-dance',
        version: process.env.npm_package_version || '2.0.0',
      });
    } catch (error) {
      return Response.json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  },
};
