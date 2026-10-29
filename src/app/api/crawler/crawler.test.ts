import { describe, it, expect } from 'vitest';
import { GET, POST } from './route';

describe('Web Crawler API Endpoint', () => {
  it('returns active status and supported Indian ad networks on GET', async () => {
    const res = await GET();
    const json = await res.json();

    expect(json.status).toBe('ACTIVE');
    expect(json.currency).toContain('INR');
    expect(json.supportedNetworks).toContain('JioCinema');
    expect(json.supportedNetworks).toContain('ShareChat');
  });

  it('crawls and returns structured Indian creative assets in INR on POST', async () => {
    const mockRequest = new Request('http://localhost:3000/api/crawler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: 'https://www.amul.com/topicals',
        brandName: 'Amul India',
        platform: 'Meta',
      }),
    });

    const res = await POST(mockRequest);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.job.brandName).toBe('Amul India');
    expect(json.job.items.length).toBeGreaterThan(0);
    expect(json.job.items[0].currency).toBe('INR');
    expect(json.job.items[0].visualStyle).toBe('2D Cartoon');
    expect(json.job.items[0].characterUsage).toBe('Mascot');
  }, 15000);

  it('falls back to stored cache when internet or network fails', async () => {

    const mockRequest = new Request('http://localhost:3000/api/crawler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: 'https://unreachable-offline-target.invalid/ads',
        brandName: 'Amul India',
        platform: 'Meta',
      }),
    });

    const res = await POST(mockRequest);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.isFromCache).toBe(true);
    expect(json.job.items.length).toBeGreaterThan(0);
    expect(json.job.items[0].currency).toBe('INR');
    expect(json.job.logs.some((l: string) => l.includes('STORED CACHE') || l.includes('stored cache'))).toBe(true);
  });
});
