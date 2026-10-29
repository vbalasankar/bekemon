import { CalculatedMetrics, Currency, PerformanceObservation } from '@/types';

export function calculateCTR(clicks: number, impressions: number): number | null {
  if (impressions <= 0 || isNaN(impressions) || isNaN(clicks)) return null;
  return (clicks / impressions) * 100;
}

export function calculateCPC(spend: number, clicks: number): number | null {
  if (clicks <= 0 || isNaN(clicks) || isNaN(spend)) return null;
  return spend / clicks;
}

export function calculateCPM(spend: number, impressions: number): number | null {
  if (impressions <= 0 || isNaN(impressions) || isNaN(spend)) return null;
  return (spend / impressions) * 1000;
}

export function calculateConversionRate(conversions: number, clicks: number): number | null {
  if (clicks <= 0 || isNaN(clicks) || isNaN(conversions)) return null;
  return (conversions / clicks) * 100;
}

export function calculateCostPerConversion(spend: number, conversions: number): number | null {
  if (conversions <= 0 || isNaN(conversions) || isNaN(spend)) return null;
  return spend / conversions;
}

export function calculateROAS(conversionValue: number | null, spend: number): number | null {
  if (conversionValue === null || spend <= 0 || isNaN(spend) || isNaN(conversionValue)) return null;
  return conversionValue / spend;
}

export function calculateVideoCompletionRate(completedViews: number | null, videoViews: number | null): number | null {
  if (completedViews === null || videoViews === null || videoViews <= 0) return null;
  return (completedViews / videoViews) * 100;
}

export function calculateEngagementRate(
  likes: number | null,
  comments: number | null,
  shares: number | null,
  clicks: number,
  impressions: number
): number | null {
  if (impressions <= 0) return null;
  const interactions = (likes ?? 0) + (comments ?? 0) + (shares ?? 0) + clicks;
  return (interactions / impressions) * 100;
}

export function aggregateObservations(observations: PerformanceObservation[]): CalculatedMetrics {
  let spend = 0;
  let impressions = 0;
  let clicks = 0;
  let conversions = 0;

  let reachSum = 0;
  let hasReach = false;

  let conversionValueSum = 0;
  let hasConversionValue = false;

  let videoViewsSum = 0;
  let completedViewsSum = 0;
  let hasVideo = false;

  let likesSum = 0;
  let commentsSum = 0;
  let sharesSum = 0;
  let hasEngagement = false;

  for (const obs of observations) {
    spend += obs.spend || 0;
    impressions += obs.impressions || 0;
    clicks += obs.clicks || 0;
    conversions += obs.conversions || 0;

    if (obs.reach !== null && obs.reach !== undefined) {
      reachSum += obs.reach;
      hasReach = true;
    }
    if (obs.conversionValue !== null && obs.conversionValue !== undefined) {
      conversionValueSum += obs.conversionValue;
      hasConversionValue = true;
    }
    if (obs.videoViews !== null && obs.videoViews !== undefined) {
      videoViewsSum += obs.videoViews;
      if (obs.completedVideoViews !== null && obs.completedVideoViews !== undefined) {
        completedViewsSum += obs.completedVideoViews;
      }
      hasVideo = true;
    }
    if (obs.likes !== null || obs.comments !== null || obs.shares !== null) {
      likesSum += obs.likes ?? 0;
      commentsSum += obs.comments ?? 0;
      sharesSum += obs.shares ?? 0;
      hasEngagement = true;
    }
  }

  return {
    spend,
    impressions,
    clicks,
    conversions,
    reach: hasReach ? reachSum : null,
    conversionValue: hasConversionValue ? conversionValueSum : null,
    videoViews: hasVideo ? videoViewsSum : null,
    completedVideoViews: hasVideo ? completedViewsSum : null,
    likes: hasEngagement ? likesSum : null,
    comments: hasEngagement ? commentsSum : null,
    shares: hasEngagement ? sharesSum : null,
    ctr: calculateCTR(clicks, impressions),
    cpc: calculateCPC(spend, clicks),
    cpm: calculateCPM(spend, impressions),
    conversionRate: calculateConversionRate(conversions, clicks),
    costPerConversion: calculateCostPerConversion(spend, conversions),
    roas: hasConversionValue ? calculateROAS(conversionValueSum, spend) : null,
    videoCompletionRate: hasVideo ? calculateVideoCompletionRate(completedViewsSum, videoViewsSum) : null,
    engagementRate: calculateEngagementRate(
      hasEngagement ? likesSum : null,
      hasEngagement ? commentsSum : null,
      hasEngagement ? sharesSum : null,
      clicks,
      impressions
    ),
  };
}

export function calculateDeltaPct(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0 || isNaN(current) || isNaN(previous)) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function checkCurrencyConsistency(observations: PerformanceObservation[]): {
  isConsistent: boolean;
  currencies: Currency[];
  primaryCurrency: Currency;
} {
  const currencySet = new Set<Currency>();
  for (const obs of observations) {
    if (obs.currency) {
      currencySet.add(obs.currency);
    }
  }
  const currencies = Array.from(currencySet);
  return {
    isConsistent: currencies.length <= 1,
    currencies,
    primaryCurrency: currencies[0] || 'INR',
  };
}

export function detectAnomalies(
  values: number[],
  thresholdStdDev = 2.0
): { index: number; value: number; isHigh: boolean; isLow: boolean; zScore: number }[] {
  if (values.length < 4) return [];

  const n = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return [];

  const anomalies: { index: number; value: number; isHigh: boolean; isLow: boolean; zScore: number }[] = [];

  values.forEach((val, idx) => {
    const zScore = (val - mean) / stdDev;
    if (Math.abs(zScore) >= thresholdStdDev) {
      anomalies.push({
        index: idx,
        value: val,
        isHigh: zScore > 0,
        isLow: zScore < 0,
        zScore,
      });
    }
  });

  return anomalies;
}

export function computeBoxPlotStats(data: number[]): [number, number, number, number, number] | null {
  if (!data || data.length === 0) return null;
  const sorted = [...data].filter((n) => typeof n === 'number' && !isNaN(n)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const getPercentile = (p: number) => {
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (upper === lower) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  const q1 = getPercentile(0.25);
  const median = getPercentile(0.5);
  const q3 = getPercentile(0.75);

  return [Number(min.toFixed(2)), Number(q1.toFixed(2)), Number(median.toFixed(2)), Number(q3.toFixed(2)), Number(max.toFixed(2))];
}
