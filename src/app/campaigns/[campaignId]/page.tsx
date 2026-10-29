'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useData } from '@/lib/context/DataContext';
import ChartContainer from '@/components/charts/ChartContainer';
import EChartsWrapper, { PLATFORM_COLORS, SWISS_PALETTE } from '@/components/charts/EChartsWrapper';
import MetricCard from '@/components/common/MetricCard';
import { aggregateObservations, calculateCTR, calculateCostPerConversion } from '@/lib/analytics/metrics';
import { exportToCsv } from '@/lib/export/csvExport';
import {
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Target,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = (params?.campaignId as string) || '';
  const { campaigns, creatives, observations } = useData();

  const campaign = useMemo(() => {
    return campaigns.find((c) => c.id === campaignId);
  }, [campaigns, campaignId]);

  const campaignObs = useMemo(() => {
    return observations.filter((o) => o.campaignId === campaignId);
  }, [observations, campaignId]);

  const campMetrics = useMemo(() => {
    return aggregateObservations(campaignObs);
  }, [campaignObs]);

  const dailyData = useMemo(() => {
    const map = new Map<string, typeof campaignObs>();
    for (const obs of campaignObs) {
      if (!map.has(obs.date)) map.set(obs.date, []);
      map.get(obs.date)!.push(obs);
    }

    const sortedDates = Array.from(map.keys()).sort();
    let runningSpend = 0;
    let runningConversions = 0;

    return sortedDates.map((date) => {
      const list = map.get(date)!;
      const agg = aggregateObservations(list);
      runningSpend += agg.spend;
      runningConversions += agg.conversions;

      return {
        date,
        spend: Math.round(agg.spend),
        conversions: agg.conversions,
        clicks: agg.clicks,
        impressions: agg.impressions,
        ctr: agg.ctr ? Number(agg.ctr.toFixed(2)) : 0,
        cpa: agg.costPerConversion ? Number(agg.costPerConversion.toFixed(2)) : null,
        cumulativeSpend: Math.round(runningSpend),
        cumulativeConversions: runningConversions,
      };
    });
  }, [campaignObs]);

  const creativeStats = useMemo(() => {
    const crMap = new Map<string, typeof campaignObs>();
    for (const obs of campaignObs) {
      if (!crMap.has(obs.creativeId)) crMap.set(obs.creativeId, []);
      crMap.get(obs.creativeId)!.push(obs);
    }

    const cLookup = new Map(creatives.map((c) => [c.id, c]));
    const rows = Array.from(crMap.entries()).map(([crId, list]) => {
      const cr = cLookup.get(crId);
      const agg = aggregateObservations(list);
      return {
        id: crId,
        name: cr?.name || crId,
        visualStyle: cr?.visualStyle || 'Unknown',
        format: cr?.creativeFormat || 'VIDEO',
        characterUsage: cr?.characterUsage || 'No Character',
        spend: agg.spend,
        impressions: agg.impressions,
        clicks: agg.clicks,
        conversions: agg.conversions,
        ctr: agg.ctr,
        cpa: agg.costPerConversion,
        thumbnailUrl: cr?.thumbnailUrl || '',
      };
    });
    return rows.sort((a, b) => b.conversions - a.conversions);
  }, [campaignObs, creatives]);

  if (!campaign) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold text-neutral-900">Campaign Not Found</h2>
        <p className="text-xs text-neutral-500 mt-1">
          The requested campaign does not exist in the active dataset.
        </p>
        <Link
          href="/campaigns"
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" /> Return to Campaign Explorer
        </Link>
      </div>
    );
  }

  const budgetUtilization = campaign.budget > 0 ? (campMetrics.spend / campaign.budget) * 100 : 0;

  const dailySpendOption = {
    grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0]?.axisValue}: ₹${Number(p[0]?.value).toLocaleString('en-IN')}` },
    xAxis: {
      type: 'category',
      data: dailyData.map((d) => d.date),
      axisLabel: { color: '#737373', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#737373', fontSize: 10, formatter: (v: number) => `₹${v >= 100000 ? `${(v/100000).toFixed(1)}L` : `${v/1000}k`}` },
      splitLine: { lineStyle: { color: '#f4f4f5' } },
    },
    series: [
      {
        data: dailyData.map((d) => d.spend),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#2563eb' },
        areaStyle: { color: 'rgba(37, 99, 235, 0.15)' },
      },
    ],
  };

  const dailyConversionOption = {
    grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis', formatter: '{b}: {c} conversions' },
    xAxis: {
      type: 'category',
      data: dailyData.map((d) => d.date),
      axisLabel: { color: '#737373', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#737373', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f4f4f5' } },
    },
    series: [
      {
        data: dailyData.map((d) => d.conversions),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#10b981' },
        areaStyle: { color: 'rgba(16, 185, 129, 0.15)' },
      },
    ],
  };

  const scatterOption = {
    grid: { left: '6%', right: '6%', bottom: '10%', top: '10%', containLabel: true },
    tooltip: {
      formatter: (p: any) =>
        `Date: ${dailyData[p.dataIndex]?.date}<br/>Spend: ₹${p.value[0]?.toLocaleString('en-IN')}<br/>Conversions: ${p.value[1]}`,
    },
    xAxis: {
      name: 'Spend (₹)',
      type: 'value',
      axisLabel: { color: '#737373', fontSize: 10, formatter: (v: number) => `₹${v >= 100000 ? `${(v/100000).toFixed(1)}L` : `${v/1000}k`}` },
      splitLine: { lineStyle: { color: '#f4f4f5' } },
    },
    yAxis: {
      name: 'Conversions',
      type: 'value',
      axisLabel: { color: '#737373', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f4f4f5' } },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: 10,
        data: dailyData.map((d) => [d.spend, d.conversions]),
        itemStyle: { color: '#8b5cf6' },
      },
    ],
  };

  const creativeBarOption = {
    grid: { left: '4%', right: '6%', bottom: '10%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: creativeStats.map((c) => (c.name.length > 14 ? c.name.slice(0, 14) + '...' : c.name)),
      axisLabel: { color: '#737373', fontSize: 9, rotate: 20 },
    },
    yAxis: {
      type: 'value',
      name: 'Conversions',
      axisLabel: { color: '#737373', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f4f4f5' } },
    },
    series: [
      {
        type: 'bar',
        data: creativeStats.map((c) => c.conversions),
        itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  const metricComparisonOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['CTR (%)', 'CVR (%)'], textStyle: { fontSize: 11, color: '#737373' } },
    grid: { left: '4%', right: '4%', bottom: '10%', top: '14%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dailyData.map((d) => d.date),
      axisLabel: { color: '#737373', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#737373', fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f4f4f5' } },
    },
    series: [
      {
        name: 'CTR (%)',
        type: 'line',
        data: dailyData.map((d) => d.ctr),
        itemStyle: { color: '#3b82f6' },
      },
      {
        name: 'CVR (%)',
        type: 'line',
        data: dailyData.map((d) => (d.clicks > 0 ? Number(((d.conversions / d.clicks) * 100).toFixed(2)) : 0)),
        itemStyle: { color: '#f59e0b' },
      },
    ],
  };

  const cumulativeSpendOption = {
    grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0]?.axisValue}: ₹${Number(p[0]?.value).toLocaleString('en-IN')}` },
    xAxis: {
      type: 'category',
      data: dailyData.map((d) => d.date),
      axisLabel: { color: '#737373', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#737373', fontSize: 10, formatter: (v: number) => `₹${v >= 100000 ? `${(v/100000).toFixed(1)}L` : `${v/1000}k`}` },
      splitLine: { lineStyle: { color: '#f4f4f5' } },
    },
    series: [
      {
        data: dailyData.map((d) => d.cumulativeSpend),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#0ea5e9' },
        areaStyle: { color: 'rgba(14, 165, 233, 0.15)' },
      },
    ],
  };

  const cumulativeConversionOption = {
    grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis', formatter: '{b}: {c} total conversions' },
    xAxis: {
      type: 'category',
      data: dailyData.map((d) => d.date),
      axisLabel: { color: '#737373', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#737373', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f4f4f5' } },
    },
    series: [
      {
        data: dailyData.map((d) => d.cumulativeConversions),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#10b981' },
        areaStyle: { color: 'rgba(16, 185, 129, 0.15)' },
      },
    ],
  };

  const calendarHeatmapOption = {
    tooltip: {
      position: 'top',
      formatter: (p: any) => `${p.value[0]}: ₹${Number(p.value[1]).toLocaleString('en-IN')} spend`,
    },
    visualMap: {
      min: 0,
      max: Math.max(...dailyData.map((d) => d.spend), 100),
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: { color: ['#eff6ff', '#3b82f6', '#1e3a8a'] },
      textStyle: { fontSize: 10, color: '#737373' },
    },
    calendar: {
      top: 25,
      left: 30,
      right: 30,
      cellSize: ['auto', 14],
      range: '2024',
      itemStyle: { borderWidth: 0.5, borderColor: '#e5e5e5' },
      yearLabel: { show: false },
      dayLabel: { firstDay: 1, nameMap: 'en', fontSize: 9, color: '#a1a1aa' },
      monthLabel: { fontSize: 10, color: '#737373' },
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: dailyData.map((d) => [d.date, d.spend]),
    },
  };

  return (
    <div className="space-y-6">

      <div>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Campaign Explorer
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200/90 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-0.5 rounded text-[11px] font-semibold text-white"
                style={{ backgroundColor: PLATFORM_COLORS[campaign.platform] || '#64748b' }}
              >
                {campaign.platform}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  campaign.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : campaign.status === 'PAUSED'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {campaign.status}
              </span>
              <span className="text-xs text-neutral-400 font-mono">ID: {campaign.id}</span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              {campaign.name}
            </h1>
            <div className="text-sm text-neutral-500 font-medium mt-0.5">{campaign.clientName}</div>
            <p className="text-xs text-neutral-600 mt-2 max-w-2xl leading-relaxed">
              {campaign.description}
            </p>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200/70 min-w-[240px]">
            <div className="text-xs text-neutral-500 font-medium mb-1">Budget Allocation</div>
            <div className="text-xl font-bold text-neutral-900 font-mono">
              ₹{Math.round(campMetrics.spend).toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-neutral-400">
                / ₹{campaign.budget.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${
                  budgetUtilization > 100
                    ? 'bg-rose-500'
                    : budgetUtilization > 85
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>
            <div className="text-[11px] text-neutral-500 mt-1.5 flex justify-between">
              <span>{budgetUtilization.toFixed(1)}% utilized</span>
              <span>
                Remaining: ₹
                {Math.max(0, Math.round(campaign.budget - campMetrics.spend)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-100">
          <MetricCard label="Total Spend" value={campMetrics.spend} format="currency" />
          <MetricCard label="Conversions" value={campMetrics.conversions} format="number" />
          <MetricCard label="CTR" value={campMetrics.ctr} format="percent" />
          <MetricCard
            label="Cost Per Conversion"
            value={campMetrics.costPerConversion}
            format="currency"
            isInverse={true}
          />
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Campaign Analytics Engine
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="1. Daily Spend Trend"
            subtitle="Daily media spend allocated to this campaign"
            onExportCsv={() => exportToCsv(`${campaign.id}_daily_spend`, dailyData)}
            isEmpty={dailyData.length === 0}
          >
            <EChartsWrapper option={dailySpendOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>

          <ChartContainer
            title="2. Daily Conversions Trend"
            subtitle="Chronological volume of conversions delivered"
            onExportCsv={() => exportToCsv(`${campaign.id}_daily_conversions`, dailyData)}
            isEmpty={dailyData.length === 0}
          >
            <EChartsWrapper option={dailyConversionOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="3. Daily Spend vs. Conversions"
            subtitle="Correlation scatter plot of daily ad expenditure against conversions"
            isEmpty={dailyData.length === 0}
          >
            <EChartsWrapper option={scatterOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>

          <ChartContainer
            title="4. Creative-Level Performance Breakdown"
            subtitle="Conversions contributed by each active creative asset in this campaign"
            onExportCsv={() => exportToCsv(`${campaign.id}_creative_breakdown`, creativeStats)}
            isEmpty={creativeStats.length === 0}
          >
            <EChartsWrapper option={creativeBarOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="7. Cumulative Spend (Chronological)"
            subtitle="Continuous running sum of media expenditure"
            isEmpty={dailyData.length === 0}
          >
            <EChartsWrapper option={cumulativeSpendOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>

          <ChartContainer
            title="8. Cumulative Conversions (Chronological)"
            subtitle="Continuous running sum of attributed conversions"
            isEmpty={dailyData.length === 0}
          >
            <EChartsWrapper option={cumulativeConversionOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="5. Efficiency Trend (CTR vs. CVR)"
            subtitle="Dual-axis comparison of click-through rate vs conversion rate"
            isEmpty={dailyData.length === 0}
          >
            <EChartsWrapper option={metricComparisonOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>

          <ChartContainer
            title="6. Campaign Activity Calendar Heatmap"
            subtitle="Daily spend intensity across the active schedule"
            isEmpty={dailyData.length === 0}
          >
            <EChartsWrapper option={calendarHeatmapOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Creative Assets in this Campaign</h3>
            <p className="text-xs text-neutral-500">
              Ranked by total conversions and cost efficiency
            </p>
          </div>
          <Link
            href="/creatives"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Open in Creative Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Creative Asset</th>
                <th className="py-2.5 px-3">Visual Style</th>
                <th className="py-2.5 px-3">Character</th>
                <th className="py-2.5 px-3 text-right">Spend</th>
                <th className="py-2.5 px-3 text-right">Impressions</th>
                <th className="py-2.5 px-3 text-right">Clicks</th>
                <th className="py-2.5 px-3 text-right">CTR</th>
                <th className="py-2.5 px-3 text-right">Conversions</th>
                <th className="py-2.5 px-3 text-right">Cost / Conv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {creativeStats.map((cr) => (
                <tr key={cr.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-neutral-900 flex items-center gap-2">
                    {cr.thumbnailUrl && (
                      <img
                        src={cr.thumbnailUrl}
                        alt={cr.name}
                        className="w-10 h-6 object-cover rounded border border-neutral-200 shrink-0"
                      />
                    )}
                    <span className="truncate max-w-xs">{cr.name}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700 font-medium">
                      {cr.visualStyle}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600">{cr.characterUsage}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">
                    ₹{Math.round(cr.spend).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                    {cr.impressions.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                    {cr.clicks.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-neutral-900">
                    {cr.ctr ? `${cr.ctr.toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                    {cr.conversions.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                    {cr.cpa ? `₹${cr.cpa.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
