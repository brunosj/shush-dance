// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('Request URL:', request.url); // Log the request URL for debugging
  return NextResponse.next();
}

// Specify the paths that the middleware should apply to
export const config = {
  matcher: [
    '/((?!api|login|media|audio).*)', // Exclude /media and /audio from middleware
  ],
};
