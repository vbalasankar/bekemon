'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/context/DataContext';
import ChartContainer from '@/components/charts/ChartContainer';
import EChartsWrapper, {
  PLATFORM_COLORS,
  SWISS_PALETTE,
} from '@/components/charts/EChartsWrapper';
import { aggregateObservations } from '@/lib/analytics/metrics';
import { exportToCsv } from '@/lib/export/csvExport';
import {
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X,
  Info,
} from 'lucide-react';

export default function CampaignComparisonsPage() {
  const { campaigns, filteredObservations } = useData();

  const [selectedIds, setSelectedIds] = useState<string[]>(['cmp-101', 'cmp-105', 'cmp-109']);

  const [timelineMetric, setTimelineMetric] = useState<string>('spend');

  const [barMetric, setBarMetric] = useState<string>('conversions');

  const [radarMode, setRadarMode] = useState<'efficiency' | 'dynamic_max'>('efficiency');

  const selectedCampaigns = useMemo(() => {
    return campaigns.filter((c) => selectedIds.includes(c.id));
  }, [campaigns, selectedIds]);

  const comparisonStats = useMemo(() => {
    return selectedCampaigns.map((camp) => {
      const campObs = filteredObservations.filter((o) => o.campaignId === camp.id);
      const agg = aggregateObservations(campObs);
      return {
        campaign: camp,
        metrics: agg,
        observationCount: campObs.length,
      };
    });
  }, [selectedCampaigns, filteredObservations]);

  const safeguards = useMemo(() => {
    const warnings: string[] = [];

    const objectives = new Set(selectedCampaigns.map((c) => c.objective));
    if (objectives.size > 1) {
      warnings.push(
        `Selected campaigns have mismatched objectives (${Array.from(objectives)
          .map((o) => o.replace('_', ' '))
          .join(', ')}). A Brand Awareness campaign naturally exhibits different CTR and conversion economics than a Conversions campaign.`
      );
    }

    const currencies = new Set(selectedCampaigns.map((c) => c.currency));
    if (currencies.size > 1) {
      warnings.push('Selected campaigns use different currencies without standardized forex conversion.');
    }

    const counts = comparisonStats.map((s) => s.observationCount);
    const maxCount = Math.max(...counts, 0);
    const minCount = Math.min(...counts, 0);
    if (maxCount > 0 && minCount / maxCount < 0.5) {
      warnings.push(
        `Observation volume disparity: one campaign has ${maxCount} daily records while another has only ${minCount}. Relative metrics are weighted, but sample sizes differ significantly.`
      );
    }

    return warnings;
  }, [selectedCampaigns, comparisonStats]);

  const sideBySideOption = useMemo(() => {
    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: comparisonStats.map((s) => (s.campaign.name.length > 18 ? s.campaign.name.slice(0, 16) + '...' : s.campaign.name)),
        axisLabel: { color: '#737373', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          name: barMetric.toUpperCase(),
          type: 'bar',
          data: comparisonStats.map((s) => {
            const v = (s.metrics as any)[barMetric] ?? 0;
            return {
              value: Number(v.toFixed(2)),
              itemStyle: { color: PLATFORM_COLORS[s.campaign.platform] || '#2563eb', borderRadius: [4, 4, 0, 0] },
            };
          }),
        },
      ],
    };
  }, [comparisonStats, barMetric]);

  const timeComparisonOption = useMemo(() => {
    const dateSet = new Set<string>();
    filteredObservations.forEach((o) => dateSet.add(o.date));
    const dates = Array.from(dateSet).sort();

    const series = selectedCampaigns.map((camp, idx) => {
      const campObs = filteredObservations.filter((o) => o.campaignId === camp.id);
      const obsMap = new Map<string, typeof campObs>();
      campObs.forEach((o) => {
        if (!obsMap.has(o.date)) obsMap.set(o.date, []);
        obsMap.get(o.date)!.push(o);
      });

      const values = dates.map((d) => {
        const list = obsMap.get(d);
        if (!list || list.length === 0) return 0;
        const agg = aggregateObservations(list);
        return (agg as any)[timelineMetric] ?? 0;
      });

      return {
        name: camp.name,
        type: 'line',
        smooth: true,
        data: values,
        itemStyle: { color: SWISS_PALETTE[idx % SWISS_PALETTE.length] },
      };
    });

    return {
      grid: { left: '4%', right: '4%', bottom: '12%', top: '14%', containLabel: true },
      tooltip: { trigger: 'axis' },
      legend: { textStyle: { color: '#737373', fontSize: 10 } },
      xAxis: { type: 'category', data: dates, axisLabel: { color: '#737373', fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      series,
    };
  }, [selectedCampaigns, filteredObservations, timelineMetric]);

  const radarOption = useMemo(() => {
    if (comparisonStats.length === 0) return {};

    const conversionsList = comparisonStats.map((s) => s.metrics.conversions || 0);
    const ctrList = comparisonStats.map((s) => s.metrics.ctr || 0);
    const impressionsList = comparisonStats.map((s) => s.metrics.impressions || 0);
    const cvrList = comparisonStats.map((s) => s.metrics.conversionRate || 0);
    const cpaList = comparisonStats.map((s) => s.metrics.costPerConversion || 0).filter((v) => v > 0);
    const cpcList = comparisonStats.map((s) => s.metrics.cpc || 0).filter((v) => v > 0);
    const spendList = comparisonStats.map((s) => s.metrics.spend || 0);

    const maxConv = Math.max(...conversionsList, 1);
    const maxCtr = Math.max(...ctrList, 0.1);
    const maxImp = Math.max(...impressionsList, 1);
    const maxCvr = Math.max(...cvrList, 0.1);
    const minCpa = cpaList.length > 0 ? Math.min(...cpaList) : 100;
    const minCpc = cpcList.length > 0 ? Math.min(...cpcList) : 5;
    const maxSpend = Math.max(...spendList, 1000);

    if (radarMode === 'efficiency') {

      const indicators = [
        { name: 'Conv. Scale', max: 100 },
        { name: 'CTR Engagement', max: 100 },
        { name: 'CPA Efficiency', max: 100 },
        { name: 'CPC Economy', max: 100 },
        { name: 'Audience Reach', max: 100 },
        { name: 'Funnel CVR', max: 100 },
      ];

      const seriesData = comparisonStats.map((s, idx) => {
        const conv = s.metrics.conversions || 0;
        const ctr = s.metrics.ctr || 0;
        const imp = s.metrics.impressions || 0;
        const cvr = s.metrics.conversionRate || 0;
        const cpa = s.metrics.costPerConversion || 0;
        const cpc = s.metrics.cpc || 0;

        const convScore = Math.max(10, Math.round((conv / maxConv) * 100));
        const ctrScore = Math.max(10, Math.round((ctr / maxCtr) * 100));
        const cpaScore = cpa > 0 ? Math.max(10, Math.min(100, Math.round((minCpa / cpa) * 100))) : 50;
        const cpcScore = cpc > 0 ? Math.max(10, Math.min(100, Math.round((minCpc / cpc) * 100))) : 50;
        const impScore = Math.max(10, Math.round((imp / maxImp) * 100));
        const cvrScore = Math.max(10, Math.round((cvr / maxCvr) * 100));

        const color = SWISS_PALETTE[idx % SWISS_PALETTE.length];

        return {
          name: s.campaign.name,
          value: [convScore, ctrScore, cpaScore, cpcScore, impScore, cvrScore],
          rawMetrics: {
            conversions: conv,
            ctr,
            cpa,
            cpc,
            impressions: imp,
            cvr,
            spend: s.metrics.spend || 0,
          },
          itemStyle: { color },
          areaStyle: {
            color: color + '25',
          },
        };
      });

      return {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#ffffff',
          borderColor: '#e5e5e5',
          textStyle: { color: '#171717', fontSize: 11 },
          formatter: (params: any) => {
            const raw = params.data?.rawMetrics;
            const vals = params.data?.value;
            if (!raw || !vals) return params.name;
            return `
              <div style="font-weight:700; margin-bottom:4px; padding-bottom:3px; border-bottom:1px solid #eee;">
                ${params.name}
              </div>
              <div style="line-height:1.6;">
                <div>• <b>Conversions:</b> ${raw.conversions.toLocaleString('en-IN')} <span style="color:#737373;">(${vals[0]}/100)</span></div>
                <div>• <b>CTR Engagement:</b> ${raw.ctr.toFixed(2)}% <span style="color:#737373;">(${vals[1]}/100)</span></div>
                <div>• <b>CPA Efficiency:</b> ${raw.cpa ? `₹${raw.cpa.toFixed(2)}` : 'N/A'} <span style="color:#737373;">(${vals[2]}/100 economy)</span></div>
                <div>• <b>CPC Economy:</b> ${raw.cpc ? `₹${raw.cpc.toFixed(2)}` : 'N/A'} <span style="color:#737373;">(${vals[3]}/100 economy)</span></div>
                <div>• <b>Audience Reach:</b> ${raw.impressions.toLocaleString('en-IN')} <span style="color:#737373;">(${vals[4]}/100)</span></div>
                <div>• <b>Funnel CVR:</b> ${raw.cvr.toFixed(2)}% <span style="color:#737373;">(${vals[5]}/100)</span></div>
                <div style="margin-top:4px; padding-top:3px; border-top:1px solid #eee; color:#525252; font-size:10px;">
                  Total Media Spend: ₹${Math.round(raw.spend).toLocaleString('en-IN')}
                </div>
              </div>
            `;
          },
        },
        legend: {
          top: 0,
          textStyle: { fontSize: 10, color: '#737373' },
          itemWidth: 12,
          itemHeight: 8,
        },
        radar: {
          indicator: indicators,
          radius: '62%',
          center: ['50%', '55%'],
          splitNumber: 4,
          shape: 'polygon',
          axisName: { color: '#525252', fontSize: 10, fontWeight: 600 },
          splitArea: {
            areaStyle: {
              color: ['#fafaf8', '#ffffff'],
            },
          },
          splitLine: {
            lineStyle: { color: '#e5e5e5' },
          },
          axisLine: {
            lineStyle: { color: '#e5e5e5' },
          },
        },
        series: [
          {
            type: 'radar',
            data: seriesData,
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: { width: 2 },
          },
        ],
      };
    } else {

      const dynMaxSpend = Math.ceil(maxSpend * 1.25);
      const dynMaxConv = Math.ceil(maxConv * 1.25);
      const dynMaxCtr = Math.ceil(maxCtr * 1.3);
      const dynMaxImp = Math.ceil(maxImp * 1.25);
      const dynMaxCpa = Math.ceil((cpaList.length > 0 ? Math.max(...cpaList) : 1000) * 1.25);

      const formatLakhs = (val: number) =>
        val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${(val / 1000).toFixed(0)}k`;

      const indicators = [
        { name: `Spend (Max ${formatLakhs(dynMaxSpend)})`, max: dynMaxSpend },
        { name: `Conversions (Max ${dynMaxConv.toLocaleString('en-IN')})`, max: dynMaxConv },
        { name: `CTR (Max ${dynMaxCtr}%)`, max: dynMaxCtr },
        { name: `Cost / Conv (Max ₹${dynMaxCpa})`, max: dynMaxCpa },
        { name: `Reach (Max ${(dynMaxImp / 100000).toFixed(1)}L)`, max: dynMaxImp },
      ];

      const seriesData = comparisonStats.map((s, idx) => {
        const color = SWISS_PALETTE[idx % SWISS_PALETTE.length];
        return {
          name: s.campaign.name,
          value: [
            Math.round(s.metrics.spend || 0),
            s.metrics.conversions || 0,
            Number((s.metrics.ctr || 0).toFixed(2)),
            Number((s.metrics.costPerConversion || 0).toFixed(2)),
            s.metrics.impressions || 0,
          ],
          itemStyle: { color },
          areaStyle: { color: color + '20' },
        };
      });

      return {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#ffffff',
          borderColor: '#e5e5e5',
          textStyle: { color: '#171717', fontSize: 11 },
          formatter: (params: any) => {
            const v = params.value;
            if (!v) return params.name;
            return `
              <div style="font-weight:700; margin-bottom:4px; padding-bottom:3px; border-bottom:1px solid #eee;">
                ${params.name}
              </div>
              <div>• Spend: ₹${Number(v[0]).toLocaleString('en-IN')}</div>
              <div>• Conversions: ${v[1].toLocaleString('en-IN')}</div>
              <div>• CTR: ${v[2]}%</div>
              <div>• Cost / Conv: ₹${v[3]}</div>
              <div>• Impressions: ${Number(v[4]).toLocaleString('en-IN')}</div>
            `;
          },
        },
        legend: { top: 0, textStyle: { fontSize: 10, color: '#737373' } },
        radar: {
          indicator: indicators,
          radius: '62%',
          center: ['50%', '55%'],
          splitNumber: 4,
          shape: 'polygon',
          axisName: { color: '#525252', fontSize: 10, fontWeight: 600 },
          splitArea: {
            areaStyle: {
              color: ['#fafaf8', '#ffffff'],
            },
          },
          splitLine: { lineStyle: { color: '#e5e5e5' } },
          axisLine: { lineStyle: { color: '#e5e5e5' } },
        },
        series: [
          {
            type: 'radar',
            data: seriesData,
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: { width: 2 },
          },
        ],
      };
    }
  }, [comparisonStats, radarMode]);

  const scatterOption = useMemo(() => {
    return {
      grid: { left: '6%', right: '6%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: {
        formatter: (p: any) =>
          `<b>${comparisonStats[p.dataIndex]?.campaign.name}</b><br/>Spend: ₹${p.value[0].toLocaleString('en-IN')}<br/>Conversions: ${p.value[1]}`,
      },
      xAxis: {
        name: 'Spend (₹)',
        type: 'value',
        axisLabel: {
          color: '#737373',
          fontSize: 10,
          formatter: (v: number) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${v / 1000}k` : v}`,
        },
      },
      yAxis: { name: 'Conversions', type: 'value', axisLabel: { color: '#737373', fontSize: 10 } },
      series: [
        {
          type: 'scatter',
          symbolSize: 22,
          data: comparisonStats.map((s) => [Math.round(s.metrics.spend), s.metrics.conversions]),
          itemStyle: {
            color: (p: any) => SWISS_PALETTE[p.dataIndex % SWISS_PALETTE.length],
          },
        },
      ],
    };
  }, [comparisonStats]);

  const toggleCampaignSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) {
        setSelectedIds(selectedIds.filter((i) => i !== id));
      }
    } else {
      if (selectedIds.length < 5) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            Campaign Side-by-Side Comparisons
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Compare 2 to 5 campaigns with safeguard warnings and normalized multi-axis benchmarks.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            exportToCsv(
              'campaign_comparison_delta',
              comparisonStats.map((s) => ({
                Campaign: s.campaign.name,
                Client: s.campaign.clientName,
                Platform: s.campaign.platform,
                Objective: s.campaign.objective,
                Spend: Math.round(s.metrics.spend),
                Conversions: s.metrics.conversions,
                CTR: s.metrics.ctr ? `${s.metrics.ctr.toFixed(2)}%` : 'N/A',
                CPC: s.metrics.cpc ? `₹${s.metrics.cpc.toFixed(2)}` : 'N/A',
                CPA: s.metrics.costPerConversion ? `₹${s.metrics.costPerConversion.toFixed(2)}` : 'N/A',
              }))
            )
          }
          className="text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 shadow-2xs"
        >
          Export Delta Matrix
        </button>
      </div>

      <div className="bg-white border border-neutral-200/90 rounded-lg p-4 shadow-2xs">
        <div className="text-xs font-semibold text-neutral-700 mb-2.5 flex items-center justify-between">
          <span>Active Comparison Items (Select 2 to 5):</span>
          <span className="font-mono text-neutral-500">{selectedIds.length} / 5 selected</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {campaigns.map((camp) => {
            const isSelected = selectedIds.includes(camp.id);
            return (
              <button
                key={camp.id}
                type="button"
                onClick={() => toggleCampaignSelection(camp.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 font-semibold shadow-2xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <span>{camp.name}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {safeguards.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-4 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Analytical Safeguards & Comparability Discrepancies</span>
          </div>
          {safeguards.map((w, idx) => (
            <p key={idx} className="leading-relaxed pl-6">
              • {w}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartContainer
          title="1. Side-by-Side Metric Comparison"
          subtitle="Compare chosen KPI across selected campaigns"
          metricSelector={{
            value: barMetric,
            options: [
              { label: 'Conversions', value: 'conversions' },
              { label: 'Total Spend (₹)', value: 'spend' },
              { label: 'CTR (%)', value: 'ctr' },
              { label: 'CPC (₹)', value: 'cpc' },
              { label: 'Cost / Conv (₹)', value: 'costPerConversion' },
            ],
            onChange: setBarMetric,
          }}
        >
          <EChartsWrapper option={sideBySideOption} style={{ height: '300px', width: '100%' }} />
        </ChartContainer>

        <ChartContainer
          title="3. Normalized Efficiency Spider Radar"
          subtitle="Holistic benchmark balancing volume against unit costs"
          infoTooltip="Normalizes multiple metrics (Conversions, CTR, inverse CPA, inverse CPC, Impressions, CVR) into a standard 0-100 index so volume and unit cost efficiency can be evaluated holistically on a single balanced polygon."
          metricSelector={{
            value: radarMode,
            options: [
              { label: 'Normalized Index (0–100)', value: 'efficiency' },
              { label: 'Dynamic Real Values', value: 'dynamic_max' },
            ],
            onChange: (val) => setRadarMode(val as 'efficiency' | 'dynamic_max'),
          }}
        >
          <EChartsWrapper option={radarOption} style={{ height: '320px', width: '100%' }} />
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartContainer
          title="2. Time-Series Trajectory Comparison"
          subtitle="Daily curves comparing campaigns over the selected date range"
          metricSelector={{
            value: timelineMetric,
            options: [
              { label: 'Daily Spend (₹)', value: 'spend' },
              { label: 'Conversions', value: 'conversions' },
              { label: 'Clicks', value: 'clicks' },
            ],
            onChange: setTimelineMetric,
          }}
        >
          <EChartsWrapper option={timeComparisonOption} style={{ height: '300px', width: '100%' }} />
        </ChartContainer>

        <ChartContainer
          title="4. Spend vs. Conversions Efficiency Benchmark"
          subtitle="Higher Y position reflects superior absolute conversion delivery"
        >
          <EChartsWrapper option={scatterOption} style={{ height: '300px', width: '100%' }} />
        </ChartContainer>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">7. Metric Difference Matrix</h2>
          <p className="text-xs text-neutral-500">
            Absolute values and comparative efficiency per campaign
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="bg-neutral-50 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Campaign</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Objective</th>
                <th className="py-2.5 px-3 text-right">Spend</th>
                <th className="py-2.5 px-3 text-right">Impressions</th>
                <th className="py-2.5 px-3 text-right">Clicks</th>
                <th className="py-2.5 px-3 text-right">CTR</th>
                <th className="py-2.5 px-3 text-right">Conversions</th>
                <th className="py-2.5 px-3 text-right">CPA</th>
                <th className="py-2.5 px-3 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {comparisonStats.map((s) => (
                <tr key={s.campaign.id} className="hover:bg-neutral-50/80">
                  <td className="py-3 px-4 font-sans font-bold text-neutral-900">{s.campaign.name}</td>
                  <td className="py-3 px-3 font-sans">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] text-white font-semibold"
                      style={{ backgroundColor: PLATFORM_COLORS[s.campaign.platform] || '#64748b' }}
                    >
                      {s.campaign.platform}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans text-neutral-500">
                    {s.campaign.objective.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-3 text-right font-medium">
                    ₹{Math.round(s.metrics.spend).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right text-neutral-600">
                    {s.metrics.impressions.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right text-neutral-600">
                    {s.metrics.clicks.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-neutral-900">
                    {s.metrics.ctr ? `${s.metrics.ctr.toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-neutral-900">
                    {s.metrics.conversions.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right text-neutral-600">
                    {s.metrics.costPerConversion ? `₹${s.metrics.costPerConversion.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-neutral-600">
                    {s.metrics.roas ? `${s.metrics.roas.toFixed(2)}x` : '—'}
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
