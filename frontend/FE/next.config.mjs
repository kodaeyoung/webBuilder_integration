/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    return config;
  },
  images: {
    domains: ["localhost", "lh3.googleusercontent.com"],
  },
};

export default {
  ...nextConfig,
  assetPrefix: "",
};
