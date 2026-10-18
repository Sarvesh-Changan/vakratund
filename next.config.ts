import type { NextConfig } from "next";
import { legacyRedirects } from "./src/config/legacy-redirects";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
  redirects: async () => [
    ...legacyRedirects,
    { source: "/blog", destination: "/", permanent: true },
    { source: "/blog/:path*", destination: "/", permanent: true },
  ],
};

export default nextConfig;
