/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd()
  },
  // Disable strict mode to prevent double API calls in development
  reactStrictMode: false,
  
  // Ensure proper API route handling
  experimental: {
    // Use stable features only
  }
};

module.exports = nextConfig;