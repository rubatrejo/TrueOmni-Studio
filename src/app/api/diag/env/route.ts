import { NextResponse } from 'next/server';

/**
 * Endpoint diagnóstico — solo devuelve presencia (boolean) de env vars
 * críticas. NO revela valores. Público para poder consultarlo durante
 * troubleshooting sin auth.
 */
export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    envVars: {
      TAVUS_API_KEY: Boolean(process.env.TAVUS_API_KEY),
      TAVUS_REPLICA_ID: Boolean(process.env.TAVUS_REPLICA_ID),
      TAVUS_PERSONA_ID: Boolean(process.env.TAVUS_PERSONA_ID),
      TAVUS_API_URL: Boolean(process.env.TAVUS_API_URL),
      KIOSK_CLIENT: process.env.KIOSK_CLIENT ?? null,
      BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      DEEPL_API_KEY: Boolean(process.env.DEEPL_API_KEY),
      ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
      AUTH_GITHUB_ID: Boolean(process.env.AUTH_GITHUB_ID),
      STUDIO_GITHUB_TOKEN: Boolean(process.env.STUDIO_GITHUB_TOKEN),
    },
    runtime: {
      vercel: Boolean(process.env.VERCEL),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
    },
  });
}
