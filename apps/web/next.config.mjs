/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Replace 'video-editor-app' with your exact GitHub repository name:
  basePath: '/video-editor-app',
};

export default nextConfig;
