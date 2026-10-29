import { NextResponse } from 'next/server';

export async function GET() {
  const metaToken = process.env.META_ACCESS_TOKEN;
  const googleToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const tiktokToken = process.env.TIKTOK_ACCESS_TOKEN;

  return NextResponse.json({
    integrations: {
      meta: {
        platform: 'Meta Ads',
        connected: !!metaToken,
        status: metaToken ? 'CONNECTED' : 'DISCONNECTED',
        hint: 'Set META_ACCESS_TOKEN in server environment to enable live sync.',
      },
      google: {
        platform: 'Google Ads',
        connected: !!googleToken,
        status: googleToken ? 'CONNECTED' : 'DISCONNECTED',
        hint: 'Set GOOGLE_ADS_DEVELOPER_TOKEN in server environment to enable live sync.',
      },
      tiktok: {
        platform: 'TikTok Ads',
        connected: !!tiktokToken,
        status: tiktokToken ? 'CONNECTED' : 'DISCONNECTED',
        hint: 'Set TIKTOK_ACCESS_TOKEN in server environment to enable live sync.',
      },
    },
    timestamp: new Date().toISOString(),
  });
}
