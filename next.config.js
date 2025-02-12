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
    optimizeCss: false,
    scrollRestoration: false,
  },
  transpilePackages: ['@firebase/auth', 'firebase', 'firebase-admin'],
  compiler: {
    removeConsole: false
  },
  env: {
    NEXT_PUBLIC_KAKAO_API_KEY: process.env.NEXT_PUBLIC_KAKAO_API_KEY || '',
  },
  headers: async () => {
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
}

module.exports = nextConfig 