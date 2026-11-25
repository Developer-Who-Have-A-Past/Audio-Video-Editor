/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the same files are served on the web, wrapped by Capacitor (Android) and Tauri (Windows).
  output: 'export',
  images: { unoptimized: true },
  transpilePackages: ['@editor/core', '@editor/engine', '@editor/ui'],
};

export default nextConfig;
