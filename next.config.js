/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  transpilePackages: ['@firebase/auth', 'firebase', 'firebase-admin'],
  compiler: {
    removeConsole: false
  },
  images: {
    domains: ['firebasestorage.googleapis.com', 't1.daumcdn.net', 'dapi.kakao.com']
  },
  env: {
    NEXT_PUBLIC_KAKAO_API_KEY: process.env.NEXT_PUBLIC_KAKAO_API_KEY,
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