const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // SWC Compiler is the default in Next.js 16
  // Babel is NOT used - Next.js uses the Rust-based SWC compiler for faster builds
  // swcMinify is enabled by default and no longer needs to be specified
  
  // Enable Turbopack for faster builds (enabled by default in Next.js 16)
  experimental: {
    // Turbopack is enabled by default in Next.js 16
    // No additional experimental config needed for basic usage
  },
  
  // Turbopack configuration (empty to silence webpack migration warning)
  turbopack: {},
  
  // Optimize build cache for Windows
  onDemandEntries: {
    // Extend page keep-alive timeout for better development experience
    maxInactiveAge: 60 * 1000,
    // Reduce build pages kept in memory to prevent memory issues
    pagesBufferLength: 5,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 
          (process.env.NODE_ENV === 'development' 
            ? 'http://localhost:8000' 
            : 'https://potomac-analyst-workbench-production.up.railway.app')}/:path*`,
      },
    ];
  },
  
  // Configure webpack for better Windows compatibility
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configure cache for Windows
    config.cache = {
      type: 'filesystem',
      cacheDirectory: path.resolve('.next/cache/webpack'),
      buildDependencies: {
        config: [__filename],
      },
    };
    
    // Windows-specific optimizations
    if (process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
