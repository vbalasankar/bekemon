import {
  Campaign,
  Creative,
  PerformanceObservation,
  InsightItem,
  CalculatedMetrics,
} from '@/types';
import { aggregateObservations } from './metrics';

export function generateInsights(
  campaigns: Campaign[],
  creatives: Creative[],
  observations: PerformanceObservation[]
): InsightItem[] {
  const insights: InsightItem[] = [];
  if (observations.length === 0) return insights;

  const totalAgg = aggregateObservations(observations);

  const platformObsMap = new Map<string, PerformanceObservation[]>();
  for (const obs of observations) {
    if (!platformObsMap.has(obs.platform)) {
      platformObsMap.set(obs.platform, []);
    }
    platformObsMap.get(obs.platform)!.push(obs);
  }

  const platformEfficiencies: { platform: string; cpa: number | null; spend: number; conversions: number }[] = [];
  platformObsMap.forEach((obsList, platform) => {
    const agg = aggregateObservations(obsList);
    if (agg.conversions > 10 && agg.costPerConversion) {
      platformEfficiencies.push({
        platform,
        cpa: agg.costPerConversion,
        spend: agg.spend,
        conversions: agg.conversions,
      });
    }
  });

  platformEfficiencies.sort((a, b) => (a.cpa || 999999) - (b.cpa || 999999));
  if (platformEfficiencies.length >= 2) {
    const bestPlatform = platformEfficiencies[0];
    insights.push({
      id: 'ins-platform-cpa-leader',
      title: `${bestPlatform.platform} Delivers Most Cost-Effective Conversions`,
      explanation: `${bestPlatform.platform} achieved the lowest customer acquisition cost at ₹${Math.round(
        bestPlatform.cpa || 0
      ).toLocaleString('en-IN')} per verified conversion across ${bestPlatform.conversions.toLocaleString('en-IN')} attributed orders.`,
      category: 'PLATFORM_OPPORTUNITY',
      severity: 'POSITIVE',
      supportingValue: `₹${Math.round(bestPlatform.cpa || 0).toLocaleString('en-IN')} CPA`,
      metricName: 'CPA',
    });
  }

  const campMap = new Map<string, Campaign>();
  const campObsMap = new Map<string, PerformanceObservation[]>();
  for (const c of campaigns) {
    campMap.set(c.id, c);
  }
  for (const obs of observations) {
    if (!campObsMap.has(obs.campaignId)) {
      campObsMap.set(obs.campaignId, []);
    }
    campObsMap.get(obs.campaignId)!.push(obs);
  }

  const roasCampaigns: { campaign: Campaign; roas: number; spend: number }[] = [];
  campObsMap.forEach((obsList, campId) => {
    const camp = campMap.get(campId);
    if (!camp) return;
    const agg = aggregateObservations(obsList);
    if (agg.roas && agg.spend > 100000) {
      roasCampaigns.push({
        campaign: camp,
        roas: agg.roas,
        spend: agg.spend,
      });
    }
  });

  roasCampaigns.sort((a, b) => b.roas - a.roas);
  if (roasCampaigns.length > 0) {
    const topRoas = roasCampaigns[0];
    insights.push({
      id: 'ins-top-roas-winner',
      title: `High Return on Ad Spend: "${topRoas.campaign.name}"`,
      explanation: `Delivering ${topRoas.roas.toFixed(2)}x ROAS on ₹${Math.round(
        topRoas.spend
      ).toLocaleString('en-IN')} media investment across ${topRoas.campaign.platform}.`,
      category: 'BUDGET_EFFICIENCY',
      severity: 'POSITIVE',
      supportingValue: `${topRoas.roas.toFixed(2)}x ROAS`,
      campaignId: topRoas.campaign.id,
      clientName: topRoas.campaign.clientName,
      platform: topRoas.campaign.platform,
    });
  }

  let missingReachCount = 0;
  let missingEngagementCount = 0;
  for (const obs of observations) {
    if (obs.reach === null) missingReachCount++;
    if (obs.likes === null) missingEngagementCount++;
  }

  if (missingEngagementCount > 0) {
    const missingPct = Math.round((missingEngagementCount / observations.length) * 100);
    insights.push({
      id: 'ins-data-quality-reach',
      title: 'Platform-Dependent Metric Completeness',
      explanation: `${missingPct}% of records omit engagement counters (likes/comments) as search and OTT video networks do not record social interactions.`,
      category: 'DATA_QUALITY',
      severity: 'INFO',
      supportingValue: `${missingPct}% optional metric omission`,
    });
  }

  return insights;
}
