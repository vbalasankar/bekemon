import { describe, it, expect } from 'vitest';
import { generateDeterministicDemoData } from './demoData';

describe('Deterministic Demo Data Generator', () => {
  it('generates consistent datasets across multiple calls', () => {
    const data1 = generateDeterministicDemoData();
    const data2 = generateDeterministicDemoData();

    expect(data1.campaigns.length).toBe(20);
    expect(data1.creatives.length).toBe(50);
    expect(data1.observations.length).toBeGreaterThan(2000);
    expect(data1.audienceObservations.length).toBeGreaterThan(100);

    expect(data1.campaigns[0].id).toBe(data2.campaigns[0].id);
    expect(data1.observations[0].spend).toBe(data2.observations[0].spend);
    expect(data1.observations[100].clicks).toBe(data2.observations[100].clicks);
  });

  it('includes cartoon and non-cartoon creative visual styles', () => {
    const { creatives } = generateDeterministicDemoData();
    const styles = new Set(creatives.map((c) => c.visualStyle));

    expect(styles.has('2D Cartoon')).toBe(true);
    expect(styles.has('3D Animation')).toBe(true);
    expect(styles.has('Anime-Inspired')).toBe(true);
    expect(styles.has('Motion Graphics')).toBe(true);
    expect(styles.has('Live Action')).toBe(true);
    expect(styles.has('Hand-Drawn Illustration')).toBe(true);
  });

  it('contains character usage variety', () => {
    const { creatives } = generateDeterministicDemoData();
    const usages = new Set(creatives.map((c) => c.characterUsage));

    expect(usages.has('Cartoon Character')).toBe(true);
    expect(usages.has('Mascot')).toBe(true);
    expect(usages.has('Animal Character')).toBe(true);
    expect(usages.has('Human Character')).toBe(true);
    expect(usages.has('No Character')).toBe(true);
  });

  it('preserves null values for unavailable metrics instead of fabricating zero', () => {
    const { creatives, observations } = generateDeterministicDemoData();

    const staticCreativeIds = new Set(
      creatives.filter((c) => c.creativeFormat === 'STATIC_IMAGE' || c.creativeFormat === 'CAROUSEL').map((c) => c.id)
    );

    const staticObs = observations.filter((o) => staticCreativeIds.has(o.creativeId));
    expect(staticObs.length).toBeGreaterThan(0);
    expect(staticObs.every((o) => o.videoViews === null)).toBe(true);
    expect(staticObs.every((o) => o.completedVideoViews === null)).toBe(true);
  });

  it('enforces Indian native context and INR only', () => {
    const { campaigns, observations } = generateDeterministicDemoData();
    expect(campaigns.every((c) => c.currency === 'INR')).toBe(true);
    expect(observations.every((o) => o.currency === 'INR')).toBe(true);

    const indianClients = new Set(campaigns.map((c) => c.clientName));
    expect(indianClients.has('Amul Dairy & Topicals')).toBe(true);
    expect(indianClients.has('CRED Rewards')).toBe(true);
    expect(indianClients.has('Swiggy Food & Instamart')).toBe(true);
    expect(indianClients.has('Zomato Delivery')).toBe(true);

    const platforms = new Set(campaigns.map((c) => c.platform));
    expect(platforms.has('JioCinema')).toBe(true);
    expect(platforms.has('ShareChat')).toBe(true);
  });
});
