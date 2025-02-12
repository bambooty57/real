/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    // 청크 설정 최적화
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 70000,
      cacheGroups: {
        default: false,
        vendors: false,
        framework: {
          chunks: 'all',
          name: 'framework',
          test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
          priority: 40,
          enforce: true,
        },
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 20,
        },
        shared: {
          name: (module, chunks) => {
            return `shared-${chunks.map(chunk => chunk.name).join('-')}`
          },
          priority: 10,
          minChunks: 2,
          reuseExistingChunk: true,
        },
      },
    };

    return config;
  },
  experimental: {
    serverActions: true,
  },
  transpilePackages: ['@firebase/auth', 'firebase', 'firebase-admin'],
  compiler: {
    removeConsole: false
  },
  env: {
    NEXT_PUBLIC_KAKAO_API_KEY: process.env.NEXT_PUBLIC_KAKAO_API_KEY || '',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  output: 'standalone',
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  publicRuntimeConfig: {
    API_URL: process.env.API_URL
  }
}

module.exports = nextConfig 