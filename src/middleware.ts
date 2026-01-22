import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  'https://www.billdrop.io',
  'https://app.billdrop.io',
  'https://accounts.google.com',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Prepare response
  const response = NextResponse.next();

  // Check if origin is allowed
  if (origin && (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:'))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
