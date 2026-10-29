export type Platform =
  | 'Meta'
  | 'Google Ads'
  | 'YouTube'
  | 'JioCinema'
  | 'ShareChat'
  | 'LinkedIn';

export type CampaignObjective =
  | 'CONVERSIONS'
  | 'TRAFFIC'
  | 'BRAND_AWARENESS'
  | 'LEAD_GENERATION'
  | 'VIDEO_VIEWS'
  | 'ENGAGEMENT';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export type Currency = 'INR';

export type CreativeFormat =
  | 'STATIC_IMAGE'
  | 'VIDEO'
  | 'ANIMATION'
  | 'CAROUSEL'
  | 'ILLUSTRATED_GRAPHIC';

export type VisualStyle =
  | '2D Cartoon'
  | '3D Animation'
  | 'Anime-Inspired'
  | 'Hand-Drawn Illustration'
  | 'Motion Graphics'
  | 'Live Action'
  | 'Mixed Media'
  | 'Other'
  | 'Unknown';

export type AnimationStyle =
  | 'Flat Animation'
  | '3D Character Animation'
  | 'Motion Graphics'
  | 'Whiteboard Animation'
  | 'Mixed Animation'
  | 'Not Applicable'
  | 'Unknown';

export type CharacterUsage =
  | 'Cartoon Character'
  | 'Human Character'
  | 'Mascot'
  | 'Animal Character'
  | 'No Character'
  | 'Unknown';

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | 'Other';

export type AttributionWindow =
  | '7d_click_1d_view'
  | '28d_click'
  | '1d_click'
  | 'unknown';

export type ObservationSource = 'DEMO' | 'IMPORT' | 'API' | 'CRAWLER';

export interface Campaign {
  id: string;
  name: string;
  clientName: string;
  platform: Platform;
  objective: CampaignObjective;
  status: CampaignStatus;
  startDate: string;
  endDate: string | null;
  currency: Currency;
  budget: number;
  description: string;
}

export interface Creative {
  id: string;
  campaignId: string;
  name: string;
  thumbnailUrl: string;
  creativeFormat: CreativeFormat;
  visualStyle: VisualStyle;
  animationStyle: AnimationStyle;
  characterUsage: CharacterUsage;
  durationSeconds: number | null;
  aspectRatio: AspectRatio;
  primaryMessage: string;
  callToAction: string;
  tags: string[];
}

export interface PerformanceObservation {
  id: string;
  date: string;
  campaignId: string;
  creativeId: string;
  platform: Platform;
  impressions: number;
  reach: number | null;
  clicks: number;
  spend: number;
  conversions: number;
  conversionValue: number | null;
  videoViews: number | null;
  completedVideoViews: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  currency: Currency;
  attributionWindow: AttributionWindow;
  source: ObservationSource;
}

export interface AudienceObservation {
  id: string;
  campaignId: string;
  date: string;
  ageGroup: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  gender: 'Female' | 'Male' | 'Other' | 'Unknown';
  region: string;
  device: 'Mobile' | 'Desktop' | 'Tablet';
  placement: 'Feed' | 'Stories' | 'Reels' | 'Search' | 'Video In-Stream';
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export interface GlobalFilters {
  dateRange: {
    start: string;
    end: string;
  };
  preset: '7d' | '14d' | '30d' | '90d' | 'all' | 'custom';
  clients: string[];
  platforms: Platform[];
  campaigns: string[];
  objectives: CampaignObjective[];
  statuses: CampaignStatus[];
  creativeFormats: CreativeFormat[];
  visualStyles: VisualStyle[];
  animationStyles: AnimationStyle[];
  characterUsages: CharacterUsage[];
  aspectRatios: AspectRatio[];
}

export interface CalculatedMetrics {
  spend: number;
  impressions: number;
  reach: number | null;
  clicks: number;
  conversions: number;
  conversionValue: number | null;
  videoViews: number | null;
  completedVideoViews: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;

  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  conversionRate: number | null;
  costPerConversion: number | null;
  roas: number | null;
  videoCompletionRate: number | null;
  engagementRate: number | null;
}

export interface MetricComparison {
  current: CalculatedMetrics;
  previous: CalculatedMetrics | null;
  deltas: {
    spendPct: number | null;
    impressionsPct: number | null;
    clicksPct: number | null;
    conversionsPct: number | null;
    ctrDeltaPct: number | null;
    cpcDeltaPct: number | null;
    costPerConversionDeltaPct: number | null;
    roasDeltaPct: number | null;
  };
}

export interface InsightItem {
  id: string;
  title: string;
  explanation: string;
  category:
    | 'SPEND_ANOMALY'
    | 'PERFORMANCE_CHANGE'
    | 'CREATIVE_WINNER'
    | 'BUDGET_EFFICIENCY'
    | 'PLATFORM_OPPORTUNITY'
    | 'DATA_QUALITY'
    | 'UNDERPERFORMER';
  severity: 'INFO' | 'POSITIVE' | 'WARNING' | 'CRITICAL';
  supportingValue: string;
  metricName?: string;
  campaignId?: string;
  creativeId?: string;
  clientName?: string;
  platform?: Platform;
  dateRange?: string;
}

export interface SavedView {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  dataset: 'campaigns' | 'creatives' | 'daily' | 'platforms' | 'styles';
  chartType:
    | 'line'
    | 'bar'
    | 'stacked_bar'
    | 'scatter'
    | 'bubble'
    | 'heatmap'
    | 'histogram'
    | 'boxplot'
    | 'treemap'
    | 'donut';
  xAxis: string;
  yAxis: string;
  groupBy: string;
  metric: string;
  filters?: Partial<GlobalFilters>;
  description?: string;
}

export interface CrawledAdItem {
  id: string;
  url: string;
  title: string;
  brandName: string;
  visualStyle: VisualStyle;
  creativeFormat: CreativeFormat;
  characterUsage: CharacterUsage;
  primaryMessage: string;
  callToAction: string;
  estimatedSpendInr: number;
  currency: Currency;
  estimatedImpressions: number;
  crawledAt: string;
  sourceUrl: string;
  platform: Platform;
  thumbnailUrl: string;
}

export interface CrawlJob {
  id: string;
  targetUrl: string;
  brandName: string;
  platform: Platform;
  status: 'PENDING' | 'CRAWLING' | 'COMPLETED' | 'FAILED';
  resultsCount: number;
  createdAt: string;
  items: CrawledAdItem[];
  logs: string[];
  isFromCache?: boolean;
  isOfflineFallback?: boolean;
  firecrawlMetadata?: {
    scrapeId?: string;
    creditsUsed?: number;
    markdownSnippet?: string;
    extractedImagesCount?: number;
    ogImage?: string;
    liveUrl?: string;
  };
}
