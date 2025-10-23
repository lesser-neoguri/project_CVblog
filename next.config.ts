import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    mdxRs: true,
  },
  webpack: (config) => {
    // MDX 파일을 위한 설정
    config.module.rules.push({
      test: /\.mdx$/,
      use: [
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins: [],
            rehypePlugins: [],
          },
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
