import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // ✅ ของใหม่: ใช้ remotePatterns แทน
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
      },
      {
        protocol: 'https',
        hostname: '*.line-scdn.net',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com', // เผื่อรูป icon ที่เราใช้
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        'localhost:3000', 
        "chirpier-gannon-windier.ngrok-free.dev"
      ],
    },
  },
  typescript: {
    // ⚠️ WARNING: Dangerously allow production builds to type check.
    ignoreBuildErrors: true, 
  },
  eslint: {
    // ⚠️ WARNING: Dangerously allow production builds to lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;