/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
