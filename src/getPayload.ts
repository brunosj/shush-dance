// payload/getPayload.ts
import dotenv from 'dotenv';
import path from 'path';
import type { Payload } from 'payload';
import payload from 'payload';
import type { InitOptions } from 'payload/config';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(__dirname, '../.env'), // Ensure the path to your .env file is correct
});

// Global cache to prevent re-initialization of Payload
let cached = (global as any).payload;

if (!cached) {
  cached = (global as any).payload = { client: null, promise: null };
}

interface Args {
  initOptions?: Partial<InitOptions>;
}

// Function to get or initialize the Payload client
export const getPayloadClient = async ({
  initOptions,
}: Args = {}): Promise<Payload> => {
  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI environment variable is missing');
  }

  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET environment variable is missing');
  }

  // Return the cached client if already initialized
  if (cached.client) {
    return cached.client;
  }

  // If the client is not initialized, initialize it and cache the promise
  if (!cached.promise) {
    cached.promise = payload.init({
      // mongoURL: process.env.DATABASE_URI,
      secret: process.env.PAYLOAD_SECRET,
      local: initOptions?.express ? false : true,
      ...(initOptions || {}),
    });
  }

  try {
    // Await the initialization promise and cache the client
    cached.client = await cached.promise;
  } catch (e: unknown) {
    cached.promise = null; // Reset the promise on error
    throw e;
  }

  return cached.client;
};
