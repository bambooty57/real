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
        lib: {
          test(module) {
            return module.size() > 160000 &&
              /node_modules[/\\]/.test(module.identifier());
          },
          name(module) {
            const hash = crypto.createHash('sha1');
            hash.update(module.identifier());
            return hash.digest('hex').substring(0, 8);
          },
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true,
        },
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 20,
        },
        shared: {
          name(module, chunks) {
            return crypto
              .createHash('sha1')
              .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
              .digest('hex') + '-shared';
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
    optimizeCss: true,
    scrollRestoration: true,
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
}

module.exports = nextConfig 