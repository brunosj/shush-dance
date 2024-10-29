// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add your middleware logic here if needed
  return NextResponse.next();
}

// Specify the paths that the middleware should apply to
export const config = {
  matcher: [
    /*
     * Apply middleware to all pages except:
     * 1. /api/* (exclude all API routes)
     * 2. /login (exclude the login page)
     * 3. /media/* (exclude media files stored in Payload CMS)
     * 4. /audio/* (exclude audio files)
     * 5. /_next/* (exclude Next.js assets, if applicable)
     */
    '/((?!api|login|media|audio|_next).*)',
  ],
};
