import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'three-stdlib', 'motion'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'models.readyplayer.me',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
