/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'ui-avatars.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'vk.com',
      'sun9-east.userapi.com',
      'sun9-west.userapi.com',
      'avatars.yandex.net',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.userapi.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.yandex.net',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '52mb',
    },
  },
  // Отключаем eslint во время build для production
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
