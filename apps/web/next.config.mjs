/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile the shared engine, which ships as TypeScript source.
  transpilePackages: ["@promptos/core"],
  webpack(config) {
    // @promptos/core uses explicit ".js" extensions in its relative imports
    // (ESM/NodeNext style). Teach webpack to resolve those to the TS sources.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
