/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  images: {
    domains: ['firebasestorage.googleapis.com', 't1.daumcdn.net', 'dapi.kakao.com']
  },
  env: {
    NEXT_PUBLIC_KAKAO_API_KEY: process.env.NEXT_PUBLIC_KAKAO_API_KEY,
  }
}

module.exports = nextConfig 