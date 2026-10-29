import { NextResponse } from 'next/server';
import { generateDeterministicDemoData } from '@/lib/data/demoData';

export async function GET() {
  const { creatives } = generateDeterministicDemoData();
  return NextResponse.json({
    count: creatives.length,
    creatives,
    source: 'BEKEMON Indian Creative Intelligence API',
  });
}
