/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains deprecated in Next 16; use remotePatterns
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.convex.cloud' },
      { protocol: 'https', hostname: '*.convex.site' },
    ],
  },
};

module.exports = nextConfig;
