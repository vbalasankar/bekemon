import { describe, it, expect } from 'vitest';
import {
  calculateCTR,
  calculateCPC,
  calculateCPM,
  calculateConversionRate,
  calculateCostPerConversion,
  calculateROAS,
  aggregateObservations,
  checkCurrencyConsistency,
  detectAnomalies,
  computeBoxPlotStats,
} from './metrics';
import { PerformanceObservation } from '@/types';

describe('BEKEMON Analytics Engine - Formula Safeguards', () => {
  it('calculates CTR correctly with normal inputs', () => {
    expect(calculateCTR(50, 1000)).toBe(5.0);
  });

  it('safely handles zero impressions for CTR and returns null', () => {
    expect(calculateCTR(10, 0)).toBeNull();
    expect(calculateCTR(0, 0)).toBeNull();
  });

  it('calculates CPC and CPM correctly', () => {
    expect(calculateCPC(100, 20)).toBe(5.0);
    expect(calculateCPM(50, 10000)).toBe(5.0);
  });

  it('safely handles zero denominators for CPC and CPM', () => {
    expect(calculateCPC(100, 0)).toBeNull();
    expect(calculateCPM(50, 0)).toBeNull();
  });

  it('calculates Conversion Rate and Cost Per Conversion', () => {
    expect(calculateConversionRate(10, 200)).toBe(5.0);
    expect(calculateCostPerConversion(1000, 25)).toBe(40.0);
    expect(calculateConversionRate(10, 0)).toBeNull();
    expect(calculateCostPerConversion(100, 0)).toBeNull();
  });

  it('calculates ROAS and respects null conversion values', () => {
    expect(calculateROAS(500, 250)).toBe(2.0);
    expect(calculateROAS(null, 250)).toBeNull();
    expect(calculateROAS(500, 0)).toBeNull();
  });

  it('performs weighted aggregations rather than averaging averages', () => {
    const obs: PerformanceObservation[] = [
      {
        id: '1',
        date: '2024-01-01',
        campaignId: 'c1',
        creativeId: 'cr1',
        platform: 'Meta',
        impressions: 1000,
        reach: 900,
        clicks: 10,
        spend: 50,
        conversions: 1,
        conversionValue: 100,
        videoViews: null,
        completedVideoViews: null,
        likes: null,
        comments: null,
        shares: null,
        currency: 'INR',
        attributionWindow: '7d_click_1d_view',
        source: 'DEMO',
      },
      {
        id: '2',
        date: '2024-01-02',
        campaignId: 'c1',
        creativeId: 'cr1',
        platform: 'Meta',
        impressions: 9000,
        reach: 8000,
        clicks: 450,
        spend: 450,
        conversions: 45,
        conversionValue: 900,
        videoViews: null,
        completedVideoViews: null,
        likes: null,
        comments: null,
        shares: null,
        currency: 'INR',
        attributionWindow: '7d_click_1d_view',
        source: 'DEMO',
      },
    ];

    const agg = aggregateObservations(obs);
    expect(agg.impressions).toBe(10000);
    expect(agg.clicks).toBe(460);
    expect(agg.spend).toBe(500);
    expect(agg.conversions).toBe(46);

    expect(agg.ctr).toBe(4.6);

    expect(Number(agg.cpc?.toFixed(2))).toBe(1.09);

    expect(Number(agg.costPerConversion?.toFixed(2))).toBe(10.87);

    expect(agg.roas).toBe(2.0);
  });

  it('checks currency consistency', () => {
    const singleCurrencyObs = [
      { currency: 'INR' },
      { currency: 'INR' },
    ] as PerformanceObservation[];
    expect(checkCurrencyConsistency(singleCurrencyObs).isConsistent).toBe(true);

    const mixedCurrencyObs = [
      { currency: 'INR' },
      { currency: 'EUR' as any },
    ] as PerformanceObservation[];
    expect(checkCurrencyConsistency(mixedCurrencyObs).isConsistent).toBe(false);
  });

  it('detects statistical anomalies with z-scores', () => {
    const values = [100, 102, 98, 101, 99, 103, 97, 100, 500];
    const anomalies = detectAnomalies(values, 2.0);
    expect(anomalies.length).toBe(1);
    expect(anomalies[0].index).toBe(8);
    expect(anomalies[0].isHigh).toBe(true);
  });

  it('computes accurate box plot statistics', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const stats = computeBoxPlotStats(data);
    expect(stats).toEqual([1, 3, 5, 7, 9]);
  });
});
