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
    serverComponentsExternalPackages: ['firebase-admin'],
    esmExternals: 'loose',
    forceSwcTransforms: true,
    isrMemoryCacheSize: 0,
    workerThreads: false,
    cpus: 1
  },
  transpilePackages: ['@firebase/auth', 'firebase', 'firebase-admin'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  env: {
    NEXT_PUBLIC_KAKAO_API_KEY: process.env.NEXT_PUBLIC_KAKAO_API_KEY || '',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          { key: 'Cache-Control', value: 'no-store' }
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  output: 'standalone',
  trailingSlash: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        }
      ],
      afterFiles: [
        {
          source: '/farmers',
          destination: '/farmers/index',
        }
      ]
    }
  },
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  publicRuntimeConfig: {
    API_URL: process.env.API_URL
  },
  optimizeFonts: false,
  typescript: {
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig 