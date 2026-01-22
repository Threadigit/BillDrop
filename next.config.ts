import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'googleusercontent.com',
      },
      {
         protocol: 'https',
         hostname: 'avatars.githubusercontent.com',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
             key: 'Permissions-Policy',
             value: 'camera=(), microphone=(), geolocation=()'
          },

          {
            key: 'Content-Security-Policy',
            value: 
              "default-src 'self'; " +
              "script-src 'self' https://accounts.google.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https://lh3.googleusercontent.com; " +
              "font-src 'self'; " +
              "connect-src 'self' https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com; " +
              "frame-src https://accounts.google.com; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self' https://accounts.google.com; " +
              "frame-ancestors 'none';"
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, private'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
