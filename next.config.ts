import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/project",
        destination: "/projects",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
