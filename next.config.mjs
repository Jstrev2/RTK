/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ],
    formats: ["image/avif", "image/webp"]
  },
  // Injury Rescue, the paid plan and the training plans were retired in
  // November 2026. Their indexed URLs land on the closest live page.
  async redirects() {
    return [
      { source: "/rescue", destination: "/", permanent: true },
      { source: "/rescue/:path*", destination: "/rundown", permanent: true },
      { source: "/premium", destination: "/", permanent: true },
      { source: "/tools/training-plans", destination: "/rundown", permanent: true },
      { source: "/tools/attire-guide", destination: "/shoes", permanent: true }
    ];
  }
};

export default nextConfig;
