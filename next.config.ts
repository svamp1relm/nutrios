import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ['192.168.1.91', '127.0.0.1'],
  serverExternalPackages: ['@openai/agents', 'openai'],
  outputFileTracingIncludes: {
    '/api/agent/run': ['./prompts/**/*.md', './data/**/*.md'],
  },
};

export default nextConfig;
