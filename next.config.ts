import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['pdf-parse', 'pdfkit'],
  outputFileTracingIncludes: {
    '/api/workforce-export': ['./assets/fonts/**/*'],
    '/api/pathway-export': ['./assets/fonts/**/*'],
  },
};
export default config;
