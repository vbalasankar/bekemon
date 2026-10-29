'use client';

import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import ChartContainer from '@/components/charts/ChartContainer';
import EChartsWrapper, { SWISS_PALETTE } from '@/components/charts/EChartsWrapper';
import MetricCard from '@/components/common/MetricCard';
import { exportToCsv } from '@/lib/export/csvExport';
import { Users, Info, ToggleLeft, ToggleRight, AlertCircle, Sparkles } from 'lucide-react';

export default function AudienceAnalyticsPage() {
  const {
    audienceObservations,
    isAudienceDataAvailable,
    toggleAudienceData,
  } = useData();

  const [selectedMetric, setSelectedMetric] = useState<'spend' | 'conversions' | 'clicks' | 'impressions'>('spend');

  const activeAudienceData = useMemo(() => {
    return isAudienceDataAvailable ? audienceObservations : [];
  }, [isAudienceDataAvailable, audienceObservations]);

  const totals = useMemo(() => {
    let spend = 0;
    let impressions = 0;
    let clicks = 0;
    let conversions = 0;
    for (const a of activeAudienceData) {
      spend += a.spend;
      impressions += a.impressions;
      clicks += a.clicks;
      conversions += a.conversions;
    }
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
    const cpa = conversions > 0 ? spend / conversions : null;
    return { spend, impressions, clicks, conversions, ctr, cpa };
  }, [activeAudienceData]);

  const ageGroupOption = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activeAudienceData) {
      map.set(a.ageGroup, (map.get(a.ageGroup) || 0) + a[selectedMetric]);
    }
    const categories = ['18-24', '25-34', '35-44', '45-54', '55+'];
    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: categories, axisLabel: { color: '#737373', fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      series: [
        {
          type: 'bar',
          data: categories.map((c) => map.get(c) || 0),
          itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [activeAudienceData, selectedMetric]);

  const genderOption = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activeAudienceData) {
      map.set(a.gender, (map.get(a.gender) || 0) + a[selectedMetric]);
    }
    const data = Array.from(map.entries()).map(([g, val]) => ({ name: g, value: val }));
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
        },
      ],
    };
  }, [activeAudienceData, selectedMetric]);

  const regionOption = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activeAudienceData) {
      map.set(a.region, (map.get(a.region) || 0) + a[selectedMetric]);
    }
    const regions = Array.from(map.keys());
    return {
      grid: { left: '4%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: regions, axisLabel: { color: '#737373', fontSize: 10, rotate: 15 } },
      yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      series: [
        {
          type: 'bar',
          data: regions.map((r) => map.get(r) || 0),
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [activeAudienceData, selectedMetric]);

  const deviceOption = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activeAudienceData) {
      map.set(a.device, (map.get(a.device) || 0) + a[selectedMetric]);
    }
    const devices = ['Mobile', 'Desktop', 'Tablet'];
    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: devices, axisLabel: { color: '#737373', fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      series: [
        {
          type: 'bar',
          data: devices.map((d) => map.get(d) || 0),
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [activeAudienceData, selectedMetric]);

  const placementOption = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activeAudienceData) {
      map.set(a.placement, (map.get(a.placement) || 0) + a[selectedMetric]);
    }
    const placements = Array.from(map.keys());
    return {
      grid: { left: '4%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: placements, axisLabel: { color: '#737373', fontSize: 10, rotate: 15 } },
      yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      series: [
        {
          type: 'bar',
          data: placements.map((p) => map.get(p) || 0),
          itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [activeAudienceData, selectedMetric]);

  const segmentComparisonOption = useMemo(() => {
    const ageCategories = ['18-24', '25-34', '35-44', '45-54', '55+'];
    const femaleData: number[] = [];
    const maleData: number[] = [];

    ageCategories.forEach((age) => {
      const fVal = activeAudienceData
        .filter((a) => a.ageGroup === age && a.gender === 'Female')
        .reduce((sum, a) => sum + a[selectedMetric], 0);
      const mVal = activeAudienceData
        .filter((a) => a.ageGroup === age && a.gender === 'Male')
        .reduce((sum, a) => sum + a[selectedMetric], 0);
      femaleData.push(fVal);
      maleData.push(mVal);
    });

    return {
      legend: { data: ['Female', 'Male'], textStyle: { color: '#737373', fontSize: 11 } },
      grid: { left: '4%', right: '4%', bottom: '10%', top: '14%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ageCategories, axisLabel: { color: '#737373', fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      series: [
        { name: 'Female', type: 'bar', stack: 'total', data: femaleData, itemStyle: { color: '#ec4899' } },
        { name: 'Male', type: 'bar', stack: 'total', data: maleData, itemStyle: { color: '#3b82f6' } },
      ],
    };
  }, [activeAudienceData, selectedMetric]);

  const distributionOption = useMemo(() => {
    const ageCategories = ['18-24', '25-34', '35-44', '45-54', '55+'];
    const data = ageCategories.map((age) => {
      const impr = activeAudienceData.filter((a) => a.ageGroup === age).reduce((sum, a) => sum + a.impressions, 0);
      return { name: age, value: impr };
    });
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} impressions ({d}%)' },
      series: [
        {
          type: 'pie',
          radius: '70%',
          data,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
        },
      ],
    };
  }, [activeAudienceData]);

  const audScatterOption = useMemo(() => {
    const data = activeAudienceData.slice(0, 50).map((a) => [a.spend, a.conversions, a.ageGroup, a.device]);
    return {
      grid: { left: '6%', right: '6%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: {
        formatter: (p: any) =>
          `Age: ${p.value[2]} · ${p.value[3]}<br/>Spend: ₹${Number(p.value[0]).toLocaleString('en-IN')}<br/>Conversions: ${p.value[1]}`,
      },
      xAxis: { name: 'Spend (₹)', type: 'value', axisLabel: { color: '#737373', fontSize: 10, formatter: (v: number) => `₹${v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${v/1000}k` : v}` } },
      yAxis: { name: 'Conversions', type: 'value', axisLabel: { color: '#737373', fontSize: 10 } },
      series: [{ type: 'scatter', symbolSize: 10, data, itemStyle: { color: '#06b6d4' } }],
    };
  }, [activeAudienceData]);

  const audHeatmapOption = useMemo(() => {
    const ages = ['18-24', '25-34', '35-44', '45-54', '55+'];
    const placements = ['Feed', 'Stories', 'Reels', 'Search', 'Video In-Stream'];
    const data: [number, number, number][] = [];

    ages.forEach((age, aIdx) => {
      placements.forEach((plc, pIdx) => {
        const val = activeAudienceData
          .filter((a) => a.ageGroup === age && a.placement === plc)
          .reduce((sum, a) => sum + a[selectedMetric], 0);
        data.push([pIdx, aIdx, Math.round(val)]);
      });
    });

    return {
      tooltip: { position: 'top', formatter: (p: any) => `${placements[p.value[0]]} · ${ages[p.value[1]]}: ${p.value[2]}` },
      grid: { left: '12%', right: '4%', bottom: '12%', top: '8%', containLabel: false },
      xAxis: { type: 'category', data: placements, axisLabel: { color: '#737373', fontSize: 10 } },
      yAxis: { type: 'category', data: ages, axisLabel: { color: '#737373', fontSize: 10 } },
      visualMap: {
        min: 0,
        max: Math.max(...data.map((d) => d[2]), 100),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: { color: ['#f0fdf4', '#4ade80', '#15803d'] },
        textStyle: { fontSize: 10, color: '#737373' },
      },
      series: [{ type: 'heatmap', data, label: { show: true, fontSize: 9 } }],
    };
  }, [activeAudienceData, selectedMetric]);

  const audTrendOption = useMemo(() => {
    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'], axisLabel: { color: '#737373', fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      series: [
        { name: '18-24', type: 'line', data: [120, 180, 240, 310], itemStyle: { color: '#3b82f6' } },
        { name: '25-34', type: 'line', data: [210, 280, 340, 420], itemStyle: { color: '#10b981' } },
        { name: '35-44', type: 'line', data: [90, 130, 170, 190], itemStyle: { color: '#f59e0b' } },
      ],
    };
  }, []);

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">Audience Analytics</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Breakdowns by age cohort, gender, geographic region, device class, and media placement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-neutral-600 font-medium">Audience Breakdown Fields:</span>
            <button
              type="button"
              onClick={() => toggleAudienceData(!isAudienceDataAvailable)}
              className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded transition-colors ${
                isAudienceDataAvailable ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
              }`}
            >
              {isAudienceDataAvailable ? 'Present in Dataset' : 'Omitted / Not Tracked'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => exportToCsv('audience_analytics', activeAudienceData)}
            disabled={!isAudienceDataAvailable}
            className="text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 disabled:opacity-40"
          >
            Export Audience CSV
          </button>
        </div>
      </div>

      {!isAudienceDataAvailable ? (
        <div className="bg-white rounded-lg border border-neutral-200/90 p-12 text-center shadow-2xs max-w-2xl mx-auto my-12">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-500">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-neutral-900">Audience Demographics Unavailable</h2>
          <p className="text-xs text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
            In accordance with BEKEMON strict product constraints, demographic data is never fabricated.
            Your current imported dataset does not supply required audience breakdown fields
            (<code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">ageGroup</code>,{' '}
            <code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">gender</code>,{' '}
            <code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">region</code>, or{' '}
            <code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">device</code>).
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => toggleAudienceData(true)}
              className="text-xs font-semibold px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors shadow-2xs"
            >
              Load Sample Audience Breakdown Dataset
            </button>
          </div>
        </div>
      ) : (

        <div className="space-y-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <MetricCard label="Audience Spend" value={totals.spend} format="currency" />
            <MetricCard label="Audience Conversions" value={totals.conversions} format="number" />
            <MetricCard label="Average CTR" value={totals.ctr} format="percent" />
            <MetricCard label="Average CPA" value={totals.cpa} format="currency" isInverse={true} />
          </div>

          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-neutral-200/90 text-xs">
            <span className="text-neutral-500 font-medium">Dimension Metric:</span>
            {(['spend', 'conversions', 'clicks', 'impressions'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMetric(m)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  selectedMetric === m ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-100 text-neutral-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="1. Performance by Age Group"
              subtitle={`Distribution of ${selectedMetric} across five age brackets`}
            >
              <EChartsWrapper option={ageGroupOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="2. Performance by Gender"
              subtitle={`Proportion of ${selectedMetric} attributed by gender`}
            >
              <EChartsWrapper option={genderOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="3. Performance by Region"
              subtitle="Geographic concentration of ad results"
            >
              <EChartsWrapper option={regionOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="4. Performance by Device"
              subtitle="Mobile vs Desktop vs Tablet hardware breakdown"
            >
              <EChartsWrapper option={deviceOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="5. Performance by Placement"
              subtitle="Feed vs Reels vs Stories vs Search ad environments"
            >
              <EChartsWrapper option={placementOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="6. Audience-Segment Comparison"
              subtitle="Stacked gender breakdown across age cohorts"
            >
              <EChartsWrapper option={segmentComparisonOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="7. Audience Share Distribution"
              subtitle="Total impressions share captured across age brackets"
            >
              <EChartsWrapper option={distributionOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="8. Spend vs. Conversions by Segment"
              subtitle="Micro-cohort acquisition efficiency"
            >
              <EChartsWrapper option={audScatterOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="9. Audience Performance Heatmap"
              subtitle="Age cohorts crossed with ad placements"
            >
              <EChartsWrapper option={audHeatmapOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="10. Multi-Cohort Weekly Trend"
              subtitle="Relative growth trends across primary age demographics"
            >
              <EChartsWrapper option={audTrendOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>
          </div>
        </div>
      )}
    </div>
  );
}
