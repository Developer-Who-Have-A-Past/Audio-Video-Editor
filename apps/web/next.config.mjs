/** @type {import('next').NextConfig} */
const isPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: isPages ? '/video-editor-app' : '',
  assetPrefix: isPages ? '/video-editor-app/' : '',
};

export default nextConfig;
