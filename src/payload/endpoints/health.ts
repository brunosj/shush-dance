import type { Endpoint } from 'payload/config'

export const healthEndpoint: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req, res) => {
    try {
      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'shush-dance',
        version: process.env.npm_package_version || '2.0.0',
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
}

