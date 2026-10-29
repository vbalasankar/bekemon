import { describe, it, expect } from 'vitest';
import { CampaignSchema, CreativeSchema, PerformanceObservationSchema } from './schemas';

describe('BEKEMON Data Validation Schemas (Zod)', () => {
  it('validates a correct campaign object', () => {
    const validCamp = {
      id: 'cmp-test-1',
      name: 'Test Campaign',
      clientName: 'Test Client',
      platform: 'Meta',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: null,
      currency: 'INR',
      budget: 15000,
      description: 'A test ad campaign',
    };

    const res = CampaignSchema.safeParse(validCamp);
    expect(res.success).toBe(true);
  });

  it('rejects invalid campaign date or negative budget', () => {
    const invalidCamp = {
      id: 'cmp-test-2',
      name: 'Test Campaign',
      clientName: 'Test Client',
      platform: 'Meta',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: 'invalid-date',
      endDate: null,
      currency: 'INR',
      budget: -500,
      description: 'A test ad campaign',
    };

    const res = CampaignSchema.safeParse(invalidCamp);
    expect(res.success).toBe(false);
  });

  it('validates creative visual style and format', () => {
    const validCreative = {
      id: 'crt-test-1',
      campaignId: 'cmp-test-1',
      name: 'Cartoon Mascot Video',
      thumbnailUrl: 'https://example.com/thumb.png',
      creativeFormat: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animationStyle: 'Flat Animation',
      characterUsage: 'Mascot',
      durationSeconds: 15,
      aspectRatio: '9:16',
      primaryMessage: 'Test Message',
      callToAction: 'Click Here',
      tags: ['mascot', 'cartoon'],
    };

    const res = CreativeSchema.safeParse(validCreative);
    expect(res.success).toBe(true);
  });

  it('validates performance observations and supports null optional metrics', () => {
    const obs = {
      id: 'obs-1',
      date: '2024-01-15',
      campaignId: 'cmp-1',
      creativeId: 'crt-1',
      platform: 'JioCinema',
      impressions: 5000,
      reach: null,
      clicks: 120,
      spend: 45.5,
      conversions: 8,
      conversionValue: null,
      videoViews: 4000,
      completedVideoViews: 1500,
      likes: null,
      comments: null,
      shares: null,
      currency: 'INR',
      attributionWindow: '7d_click_1d_view',
      source: 'IMPORT',
    };

    const res = PerformanceObservationSchema.safeParse(obs);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.reach).toBeNull();
      expect(res.data.conversionValue).toBeNull();
    }
  });

  it('rejects negative spend or impressions in observations', () => {
    const badObs = {
      id: 'obs-bad',
      date: '2024-01-15',
      campaignId: 'cmp-1',
      creativeId: 'crt-1',
      platform: 'JioCinema',
      impressions: -100,
      reach: null,
      clicks: 10,
      spend: -50,
      conversions: 0,
      currency: 'INR',
      attributionWindow: '7d_click_1d_view',
      source: 'IMPORT',
    };

    const res = PerformanceObservationSchema.safeParse(badObs);
    expect(res.success).toBe(false);
  });
});
