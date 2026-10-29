'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import MetricCard from '@/components/common/MetricCard';
import ChartContainer from '@/components/charts/ChartContainer';
import EChartsWrapper, { PLATFORM_COLORS, SWISS_PALETTE } from '@/components/charts/EChartsWrapper';
import { calculateDeltaPct, aggregateObservations } from '@/lib/analytics/metrics';
import { generateInsights } from '@/lib/analytics/insights';
import { exportToCsv } from '@/lib/export/csvExport';
import {
  TrendingUp,
  Search,
  ArrowUpDown,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function OverviewPage() {
  const {
    filteredObservations,
    campaigns,
    creatives,
    metrics,
    previousMetrics,
    filters,
  } = useData();

  const [timelineMetric, setTimelineMetric] = useState<string>('spend');

  const [heatmapMetric, setHeatmapMetric] = useState<string>('spend');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const deltas = useMemo(() => {
    return {
      spend: calculateDeltaPct(metrics.spend, previousMetrics?.spend ?? null),
      impressions: calculateDeltaPct(metrics.impressions, previousMetrics?.impressions ?? null),
      clicks: calculateDeltaPct(metrics.clicks, previousMetrics?.clicks ?? null),
      conversions: calculateDeltaPct(metrics.conversions, previousMetrics?.conversions ?? null),
      ctr: calculateDeltaPct(metrics.ctr, previousMetrics?.ctr ?? null),
      cpc: calculateDeltaPct(metrics.cpc, previousMetrics?.cpc ?? null),
      costPerConversion: calculateDeltaPct(
        metrics.costPerConversion,
        previousMetrics?.costPerConversion ?? null
      ),
      roas: calculateDeltaPct(metrics.roas, previousMetrics?.roas ?? null),
    };
  }, [metrics, previousMetrics]);

  const timelineData = useMemo(() => {
    const dateMap = new Map<string, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      if (!dateMap.has(obs.date)) {
        dateMap.set(obs.date, []);
      }
      dateMap.get(obs.date)!.push(obs);
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    const rows = sortedDates.map((date) => {
      const agg = aggregateObservations(dateMap.get(date)!);
      return {
        date,
        spend: Math.round(agg.spend),
        impressions: agg.impressions,
        clicks: agg.clicks,
        conversions: agg.conversions,
        ctr: agg.ctr ? Number(agg.ctr.toFixed(2)) : null,
        cpc: agg.cpc ? Number(agg.cpc.toFixed(2)) : null,
        costPerConversion: agg.costPerConversion ? Number(agg.costPerConversion.toFixed(2)) : null,
      };
    });
    return rows;
  }, [filteredObservations]);

  const timelineOption = useMemo(() => {
    const dates = timelineData.map((d) => d.date);
    const values = timelineData.map((d) => (d as any)[timelineMetric] ?? 0);

    const metricLabels: Record<string, string> = {
      spend: 'Spend (₹)',
      impressions: 'Impressions',
      clicks: 'Clicks',
      conversions: 'Conversions',
      ctr: 'CTR (%)',
      cpc: 'CPC (₹)',
      costPerConversion: 'Cost per Conv (₹)',
    };

    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '12%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!params || !params[0]) return '';
          const p = params[0];
          const val = p.value;
          const label = metricLabels[timelineMetric] || timelineMetric;
          const formatted =
            timelineMetric === 'spend' || timelineMetric === 'cpc' || timelineMetric === 'costPerConversion'
              ? `₹${val.toLocaleString('en-IN')}`
              : timelineMetric === 'ctr'
              ? `${val}%`
              : val.toLocaleString('en-IN');
          return `<div class="font-sans">
            <div class="text-xs text-neutral-400 font-mono">${p.axisValue}</div>
            <div class="text-sm font-bold text-white mt-1">${label}: ${formatted}</div>
          </div>`;
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#e5e5e5' } },
        axisLabel: { color: '#737373', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f4f4f5' } },
        axisLabel: {
          color: '#737373',
          fontSize: 11,
          formatter: (v: number) => {
            if (timelineMetric === 'spend' || timelineMetric === 'cpc' || timelineMetric === 'costPerConversion') {
              return `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
            }
            if (timelineMetric === 'ctr') return `${v}%`;
            return v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v;
          },
        },
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 20, bottom: 2 }],
      series: [
        {
          name: metricLabels[timelineMetric],
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: values,
          itemStyle: { color: '#2563eb' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37, 99, 235, 0.22)' },
                { offset: 1, color: 'rgba(37, 99, 235, 0.01)' },
              ],
            },
          },
        },
      ],
    };
  }, [timelineData, timelineMetric]);

  const platformStats = useMemo(() => {
    const map = new Map<string, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      if (!map.has(obs.platform)) map.set(obs.platform, []);
      map.get(obs.platform)!.push(obs);
    }

    const rows = Array.from(map.entries()).map(([platform, list]) => {
      const agg = aggregateObservations(list);
      return {
        platform,
        spend: Math.round(agg.spend),
        conversions: agg.conversions,
        clicks: agg.clicks,
        impressions: agg.impressions,
        ctr: agg.ctr ? Number(agg.ctr.toFixed(2)) : 0,
        cpa: agg.costPerConversion ? Number(agg.costPerConversion.toFixed(2)) : null,
      };
    });
    return rows.sort((a, b) => b.spend - a.spend);
  }, [filteredObservations]);

  const platformShareOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}: ₹${params.value.toLocaleString('en-IN')} (${params.percent}%)`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11, color: '#52525b' },
      },
      series: [
        {
          name: 'Platform Spend',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 12, fontWeight: 'bold' },
          },
          data: platformStats.map((p) => ({
            name: p.platform,
            value: p.spend,
            itemStyle: { color: PLATFORM_COLORS[p.platform] || '#64748b' },
          })),
        },
      ],
    };
  }, [platformStats]);

  const scatterOption = useMemo(() => {
    const campMap = new Map<string, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      if (!campMap.has(obs.campaignId)) campMap.set(obs.campaignId, []);
      campMap.get(obs.campaignId)!.push(obs);
    }

    const cMap = new Map(campaigns.map((c) => [c.id, c]));
    const dataPoints: any[] = [];

    campMap.forEach((list, cId) => {
      const camp = cMap.get(cId);
      if (!camp) return;
      const agg = aggregateObservations(list);
      dataPoints.push({
        name: camp.name,
        client: camp.clientName,
        platform: camp.platform,
        value: [Math.round(agg.spend), agg.conversions, agg.impressions],
        cpa: agg.costPerConversion ? `₹${agg.costPerConversion.toFixed(2)}` : 'N/A',
      });
    });

    return {
      grid: { left: '6%', right: '8%', bottom: '12%', top: '10%', containLabel: true },
      tooltip: {
        formatter: (p: any) => {
          const d = p.data;
          return `<div class="font-sans">
            <div class="font-bold text-white text-xs">${d.name}</div>
            <div class="text-[11px] text-neutral-400">${d.client} · ${d.platform}</div>
            <div class="mt-1.5 pt-1 border-t border-neutral-700 text-xs">
              <div>Spend: <b>₹${d.value[0].toLocaleString('en-IN')}</b></div>
              <div>Conversions: <b>${d.value[1].toLocaleString('en-IN')}</b></div>
              <div>Cost / Conv: <b>${d.cpa}</b></div>
            </div>
          </div>`;
        },
      },
      xAxis: {
        name: 'Spend (₹)',
        type: 'value',
        splitLine: { lineStyle: { color: '#f4f4f5' } },
        axisLabel: {
          color: '#737373',
          fontSize: 11,
          formatter: (v: number) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${v / 1000}k` : v}`,
        },
      },
      yAxis: {
        name: 'Conversions',
        type: 'value',
        splitLine: { lineStyle: { color: '#f4f4f5' } },
        axisLabel: { color: '#737373', fontSize: 11 },
      },
      series: [
        {
          type: 'scatter',
          data: dataPoints,
          symbolSize: (val: number[]) => {
            const impr = val[2] || 1000;
            return Math.min(48, Math.max(12, Math.sqrt(impr) / 25));
          },
          itemStyle: {
            color: (p: any) => PLATFORM_COLORS[p.data.platform] || '#2563eb',
            opacity: 0.8,
            borderColor: '#ffffff',
            borderWidth: 1.5,
          },
        },
      ],
    };
  }, [filteredObservations, campaigns]);

  const campaignStatusData = useMemo(() => {
    let active = 0;
    let paused = 0;
    let completed = 0;

    for (const c of campaigns) {
      if (c.status === 'ACTIVE') active++;
      else if (c.status === 'PAUSED') paused++;
      else if (c.status === 'COMPLETED') completed++;
    }

    const total = campaigns.length;
    return [
      { name: 'Active', count: active, pct: total ? ((active / total) * 100).toFixed(0) : 0, color: '#10b981' },
      { name: 'Paused', count: paused, pct: total ? ((paused / total) * 100).toFixed(0) : 0, color: '#f59e0b' },
      { name: 'Completed', count: completed, pct: total ? ((completed / total) * 100).toFixed(0) : 0, color: '#64748b' },
    ];
  }, [campaigns]);

  const campaignTableData = useMemo(() => {
    const campMap = new Map<string, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      if (!campMap.has(obs.campaignId)) campMap.set(obs.campaignId, []);
      campMap.get(obs.campaignId)!.push(obs);
    }

    const cMap = new Map(campaigns.map((c) => [c.id, c]));
    const rows = Array.from(campMap.entries()).map(([cId, list]) => {
      const camp = cMap.get(cId);
      const agg = aggregateObservations(list);
      return {
        id: cId,
        name: camp?.name || cId,
        clientName: camp?.clientName || 'Unknown',
        platform: camp?.platform || 'Meta',
        status: camp?.status || 'ACTIVE',
        spend: agg.spend,
        impressions: agg.impressions,
        clicks: agg.clicks,
        conversions: agg.conversions,
        ctr: agg.ctr,
        costPerConversion: agg.costPerConversion,
      };
    });

    let filtered = rows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.clientName.toLowerCase().includes(q) ||
          r.platform.toLowerCase().includes(q)
      );
    }

    filtered.sort((a: any, b: any) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return filtered;
  }, [filteredObservations, campaigns, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(campaignTableData.length / pageSize) || 1;
  const paginatedCampaigns = campaignTableData.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            Campaign Intelligence Overview
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Cross-platform advertising performance, creative-level trends, and budget allocation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          label="Total Spend"
          value={metrics.spend}
          format="currency"
          deltaPct={deltas.spend}
          subtext="Total media investment"
        />
        <MetricCard
          label="Impressions"
          value={metrics.impressions}
          format="number"
          deltaPct={deltas.impressions}
          subtext="Ad views across networks"
        />
        <MetricCard
          label="Total Clicks"
          value={metrics.clicks}
          format="number"
          deltaPct={deltas.clicks}
          subtext="Traffic delivered"
        />
        <MetricCard
          label="Conversions"
          value={metrics.conversions}
          format="number"
          deltaPct={deltas.conversions}
          subtext="Attributed goal actions"
        />
        <MetricCard
          label="CTR"
          value={metrics.ctr}
          format="percent"
          deltaPct={deltas.ctr}
          subtext="Click-through rate"
        />
        <MetricCard
          label="CPC"
          value={metrics.cpc}
          format="currency"
          deltaPct={deltas.cpc}
          isInverse={true}
          subtext="Average cost per click"
        />
        <MetricCard
          label="Cost Per Conversion"
          value={metrics.costPerConversion}
          format="currency"
          deltaPct={deltas.costPerConversion}
          isInverse={true}
          subtext="Acquisition cost"
        />
        <MetricCard
          label="ROAS"
          value={metrics.roas}
          format="ratio"
          deltaPct={deltas.roas}
          subtext="Return on ad spend"
        />
      </div>

      <ChartContainer
        title="Performance Timeline"
        subtitle="Daily metric trends across all active campaigns and platforms"
        infoTooltip="Displays daily aggregated values. Use the dropdown to toggle metrics or zoom to inspect specific date brackets."
        metricSelector={{
          value: timelineMetric,
          options: [
            { label: 'Spend (₹)', value: 'spend' },
            { label: 'Impressions', value: 'impressions' },
            { label: 'Clicks', value: 'clicks' },
            { label: 'Conversions', value: 'conversions' },
            { label: 'CTR (%)', value: 'ctr' },
            { label: 'CPC (₹)', value: 'cpc' },
            { label: 'Cost Per Conversion (₹)', value: 'costPerConversion' },
          ],
          onChange: setTimelineMetric,
        }}
        onExportCsv={() => exportToCsv(`timeline_${timelineMetric}`, timelineData)}
        isEmpty={timelineData.length === 0}
      >
        <EChartsWrapper option={timelineOption} style={{ height: '360px', width: '100%' }} />
      </ChartContainer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-1">
          <ChartContainer
            title="Platform Spend Share"
            subtitle="Budget allocation by advertising network"
            infoTooltip="Share of ad spend captured by Meta, Google, TikTok, YouTube, and LinkedIn."
            onExportCsv={() => exportToCsv('platform_share', platformStats)}
            isEmpty={platformStats.length === 0}
          >
            <EChartsWrapper option={platformShareOption} style={{ height: '320px', width: '100%' }} />
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          <ChartContainer
            title="Spend vs. Conversions (Campaign Efficiency)"
            subtitle="Bubble size represents total impressions. Higher Y / Lower X indicates higher efficiency."
            infoTooltip="Each bubble is a campaign. Campaigns differ in objective, budget, and targeting; evaluate within category context."
            onExportCsv={() =>
              exportToCsv(
                'spend_vs_conversions',
                campaignTableData.map((c) => ({
                  Campaign: c.name,
                  Platform: c.platform,
                  Spend: c.spend,
                  Conversions: c.conversions,
                  CPA: c.costPerConversion,
                }))
              )
            }
            isEmpty={filteredObservations.length === 0}
          >
            <EChartsWrapper option={scatterOption} style={{ height: '320px', width: '100%' }} />
          </ChartContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200/90 p-4 shadow-2xs">
        <div className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-3">
          Campaign Portfolio Status
        </div>
        <div className="grid grid-cols-3 gap-4">
          {campaignStatusData.map((st) => (
            <div key={st.name} className="border-l-2 pl-3 py-1" style={{ borderColor: st.color }}>
              <div className="text-xs text-neutral-500 font-medium">{st.name}</div>
              <div className="text-lg font-bold text-neutral-900 mt-0.5">
                {st.count}{' '}
                <span className="text-xs font-normal text-neutral-400">({st.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Campaign Performance Ranking</h2>
            <p className="text-xs text-neutral-500">
              Sorted by performance metrics with direct link to campaign breakdown
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaign or client..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1 text-xs border border-neutral-200 rounded-md bg-neutral-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-56"
              />
            </div>
            <button
              type="button"
              onClick={() => exportToCsv('campaign_rankings', campaignTableData)}
              className="text-xs font-medium px-2.5 py-1 border border-neutral-200 hover:bg-neutral-50 rounded-md text-neutral-700 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Campaign</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('spend')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Spend</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('impressions')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Impressions</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('clicks')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Clicks</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('ctr')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>CTR</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer text-right" onClick={() => handleSort('conversions')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Conversions</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th
                  className="py-2.5 px-3 cursor-pointer text-right"
                  onClick={() => handleSort('costPerConversion')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Cost / Conv</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-400">
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                paginatedCampaigns.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-neutral-900">
                      <Link
                        href={`/campaigns/${row.id}`}
                        className="hover:text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <span className="truncate max-w-xs">{row.name}</span>
                      </Link>
                      <div className="text-[10px] text-neutral-400 font-normal">{row.clientName}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                        style={{ backgroundColor: PLATFORM_COLORS[row.platform] || '#64748b' }}
                      >
                        {row.platform}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      ₹{Math.round(row.spend).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                      {row.impressions.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                      {row.clicks.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-neutral-900">
                      {row.ctr !== null ? `${row.ctr.toFixed(2)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-neutral-900">
                      {row.conversions.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                      {row.costPerConversion !== null ? `₹${row.costPerConversion.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Link
                        href={`/campaigns/${row.id}`}
                        className="p-1 text-neutral-400 hover:text-blue-600 inline-flex items-center justify-center rounded"
                        title="View Campaign Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, campaignTableData.length)} of {campaignTableData.length} campaigns
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 border border-neutral-200 rounded disabled:opacity-40 hover:bg-neutral-50"
            >
              Previous
            </button>
            <span className="px-2 font-mono">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 border border-neutral-200 rounded disabled:opacity-40 hover:bg-neutral-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
