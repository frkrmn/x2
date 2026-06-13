/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    IG_ACCESS_TOKEN: process.env.IG_ACCESS_TOKEN,
    IG_USER_ID: process.env.IG_USER_ID,
  },
}

module.exports = nextConfig
