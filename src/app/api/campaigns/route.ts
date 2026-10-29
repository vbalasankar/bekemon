import { NextResponse } from 'next/server';
import { generateDeterministicDemoData } from '@/lib/data/demoData';

export async function GET() {
  const { campaigns } = generateDeterministicDemoData();
  return NextResponse.json({
    currency: 'INR',
    count: campaigns.length,
    campaigns,
    source: 'BEKEMON Indian Campaign Analytics API',
  });
}
