'use client';

import React, { useMemo, useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import ChartContainer from '@/components/charts/ChartContainer';
import EChartsWrapper, {
  PLATFORM_COLORS,
  SWISS_PALETTE,
} from '@/components/charts/EChartsWrapper';
import MetricCard from '@/components/common/MetricCard';
import {
  aggregateObservations,
  detectAnomalies,
  calculateCostPerConversion,
} from '@/lib/analytics/metrics';
import { exportToCsv } from '@/lib/export/csvExport';
import {
  Wallet,
  AlertTriangle,
  Sliders,
  TrendingUp,
  Info,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';

export default function BudgetIntelligencePage() {
  const { campaigns, filteredObservations } = useData();

  const [costMetric, setCostMetric] = useState<'cpa' | 'cpc' | 'cpm'>('cpa');

  const campaignBudgetStats = useMemo(() => {
    const obsMap = new Map<string, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      if (!obsMap.has(obs.campaignId)) obsMap.set(obs.campaignId, []);
      obsMap.get(obs.campaignId)!.push(obs);
    }

    return campaigns.map((camp) => {
      const list = obsMap.get(camp.id) || [];
      const agg = aggregateObservations(list);
      const utilization = camp.budget > 0 ? (agg.spend / camp.budget) * 100 : 0;
      return {
        ...camp,
        spend: agg.spend,
        conversions: agg.conversions,
        impressions: agg.impressions,
        clicks: agg.clicks,
        cpc: agg.cpc,
        cpm: agg.cpm,
        cpa: agg.costPerConversion,
        utilization,
        remaining: Math.max(0, camp.budget - agg.spend),
      };
    });
  }, [campaigns, filteredObservations]);

  const totalBudget = useMemo(() => campaigns.reduce((sum, c) => sum + c.budget, 0), [campaigns]);
  const totalSpend = useMemo(() => campaignBudgetStats.reduce((sum, c) => sum + c.spend, 0), [campaignBudgetStats]);
  const remainingBudget = Math.max(0, totalBudget - totalSpend);
  const overallUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
  const campaignsNearThreshold = campaignBudgetStats.filter((c) => c.utilization >= 85).length;

  const treemapOption = useMemo(() => {
    const clientMap = new Map<string, { name: string; value: number; children: any[] }>();
    for (const stat of campaignBudgetStats) {
      if (!clientMap.has(stat.clientName)) {
        clientMap.set(stat.clientName, { name: stat.clientName, value: 0, children: [] });
      }
      const clientNode = clientMap.get(stat.clientName)!;
      clientNode.value += Math.round(stat.spend);
      clientNode.children.push({
        name: stat.name,
        value: Math.round(stat.spend),
        budget: stat.budget,
        platform: stat.platform,
      });
    }

    const treeData = Array.from(clientMap.values());

    return {
      tooltip: {
        formatter: (p: any) => {
          return `${p.name}<br/>Spend: ₹${p.value?.toLocaleString('en-IN')}`;
        },
      },
      series: [
        {
          type: 'treemap',
          data: treeData,
          leafDepth: 2,
          roam: false,
          label: { show: true, formatter: (p: any) => `${p.name}\n₹${p.value >= 100000 ? `${(p.value / 100000).toFixed(1)}L` : p.value?.toLocaleString('en-IN')}` },
          itemStyle: { borderColor: '#ffffff', borderWidth: 1.5 },
        },
      ],
    };
  }, [campaignBudgetStats]);

  const budgetVsActualOption = useMemo(() => {
    const sorted = [...campaignBudgetStats].sort((a, b) => b.budget - a.budget).slice(0, 10);
    return {
      grid: { left: '4%', right: '4%', bottom: '12%', top: '14%', containLabel: true },
      legend: { data: ['Configured Budget', 'Actual Spend'], textStyle: { color: '#737373', fontSize: 10 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: sorted.map((c) => (c.name.length > 14 ? c.name.slice(0, 12) + '...' : c.name)),
        axisLabel: { color: '#737373', fontSize: 9, rotate: 15 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10, formatter: (v: number) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${v / 1000}k` : v}` },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          name: 'Configured Budget',
          type: 'bar',
          data: sorted.map((c) => c.budget),
          itemStyle: { color: '#cbd5e1', borderRadius: [3, 3, 0, 0] },
        },
        {
          name: 'Actual Spend',
          type: 'bar',
          data: sorted.map((c) => Math.round(c.spend)),
          itemStyle: { color: '#2563eb', borderRadius: [3, 3, 0, 0] },
        },
      ],
    };
  }, [campaignBudgetStats]);

  const utilizationOption = useMemo(() => {
    const sorted = [...campaignBudgetStats].sort((a, b) => b.utilization - a.utilization).slice(0, 8).reverse();
    return {
      grid: { left: '4%', right: '10%', bottom: '6%', top: '4%', containLabel: true },
      tooltip: { trigger: 'axis', formatter: '{b}: {c}% utilized' },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      yAxis: {
        type: 'category',
        data: sorted.map((c) => (c.name.length > 18 ? c.name.slice(0, 16) + '...' : c.name)),
        axisLabel: { color: '#737373', fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((c) => ({
            value: Number(c.utilization.toFixed(1)),
            itemStyle: {
              color: c.utilization > 100 ? '#ef4444' : c.utilization > 85 ? '#f59e0b' : '#10b981',
              borderRadius: [0, 4, 4, 0],
            },
          })),
        },
      ],
    };
  }, [campaignBudgetStats]);

  const spendVsConvOption = useMemo(() => {
    return {
      grid: { left: '6%', right: '6%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: {
        formatter: (p: any) =>
          `<b>${campaignBudgetStats[p.dataIndex]?.name}</b><br/>Spend: ₹${p.value[0].toLocaleString('en-IN')}<br/>Conversions: ${p.value[1]}`,
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
          symbolSize: (v: number[]) => Math.min(32, Math.max(8, Math.sqrt(v[1]) * 2)),
          data: campaignBudgetStats.map((c) => [Math.round(c.spend), c.conversions]),
          itemStyle: { color: '#3b82f6' },
        },
      ],
    };
  }, [campaignBudgetStats]);

  const chronologicalSpendData = useMemo(() => {
    const dateMap = new Map<string, number>();
    for (const obs of filteredObservations) {
      dateMap.set(obs.date, (dateMap.get(obs.date) || 0) + obs.spend);
    }
    const dates = Array.from(dateMap.keys()).sort();
    let cumulative = 0;
    return dates.map((d) => {
      const daily = dateMap.get(d) || 0;
      cumulative += daily;
      return { date: d, daily: Math.round(daily), cumulative: Math.round(cumulative) };
    });
  }, [filteredObservations]);

  const dailyTrendOption = {
    grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0]?.name}: ₹${Number(params[0]?.value).toLocaleString('en-IN')}` },
    xAxis: { type: 'category', data: chronologicalSpendData.map((d) => d.date), axisLabel: { color: '#737373', fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10, formatter: (v: number) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${v / 1000}k` : v}` }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
    series: [
      {
        data: chronologicalSpendData.map((d) => d.daily),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#2563eb' },
        areaStyle: { color: 'rgba(37, 99, 235, 0.12)' },
      },
    ],
  };

  const cumulativeSpendOption = {
    grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0]?.name}: ₹${Number(params[0]?.value).toLocaleString('en-IN')}` },
    xAxis: { type: 'category', data: chronologicalSpendData.map((d) => d.date), axisLabel: { color: '#737373', fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10, formatter: (v: number) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${v / 1000}k` : v}` }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
    series: [
      {
        data: chronologicalSpendData.map((d) => d.cumulative),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#059669' },
        areaStyle: { color: 'rgba(5, 150, 105, 0.12)' },
      },
    ],
  };

  const costEfficiencyOption = useMemo(() => {
    const valid = campaignBudgetStats.filter((c) => c[costMetric] !== null && c[costMetric] !== undefined);
    valid.sort((a, b) => (a[costMetric] || 0) - (b[costMetric] || 0));
    return {
      grid: { left: '4%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: valid.map((c) => (c.name.length > 14 ? c.name.slice(0, 12) + '...' : c.name)),
        axisLabel: { color: '#737373', fontSize: 9, rotate: 15 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10, formatter: '₹{value}' },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          name: costMetric.toUpperCase(),
          type: 'bar',
          data: valid.map((c) => Number(c[costMetric]?.toFixed(2))),
          itemStyle: { color: '#f59e0b', borderRadius: [3, 3, 0, 0] },
        },
      ],
    };
  }, [campaignBudgetStats, costMetric]);

  const histogramOption = useMemo(() => {
    const bins = [
      { label: '< ₹40L', min: 0, max: 4000000, count: 0 },
      { label: '₹40L–₹60L', min: 4000000, max: 6000000, count: 0 },
      { label: '₹60L–₹80L', min: 6000000, max: 8000000, count: 0 },
      { label: '₹80L+', min: 8000000, max: 99999999, count: 0 },
    ];
    for (const c of campaigns) {
      for (const b of bins) {
        if (c.budget >= b.min && c.budget < b.max) {
          b.count++;
          break;
        }
      }
    }
    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: bins.map((b) => b.label), axisLabel: { color: '#737373', fontSize: 10 } },
      yAxis: { type: 'value', name: 'Campaigns', axisLabel: { color: '#737373', fontSize: 10 } },
      series: [
        {
          type: 'bar',
          data: bins.map((b) => b.count),
          itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [campaigns]);

  const paretoOption = useMemo(() => {
    const sorted = [...campaignBudgetStats].sort((a, b) => b.spend - a.spend);
    const total = sorted.reduce((sum, c) => sum + c.spend, 0);
    let cumulative = 0;
    const cumPcts = sorted.map((c) => {
      cumulative += c.spend;
      return Number(((cumulative / total) * 100).toFixed(1));
    });

    return {
      grid: { left: '4%', right: '6%', bottom: '12%', top: '14%', containLabel: true },
      tooltip: { trigger: 'axis' },
      legend: { data: ['Campaign Spend', 'Cumulative %'], textStyle: { fontSize: 10, color: '#737373' } },
      xAxis: {
        type: 'category',
        data: sorted.map((_, idx) => `#${idx + 1}`),
        axisLabel: { color: '#737373', fontSize: 10 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Spend (₹)',
          axisLabel: {
            color: '#737373',
            fontSize: 10,
            formatter: (v: number) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${v / 1000}k`}`,
          },
        },
        { type: 'value', name: 'Cumul %', max: 100, axisLabel: { color: '#737373', fontSize: 10, formatter: '{value}%' } },
      ],
      series: [
        {
          name: 'Campaign Spend',
          type: 'bar',
          data: sorted.map((c) => Math.round(c.spend)),
          itemStyle: { color: '#2563eb' },
        },
        {
          name: 'Cumulative %',
          type: 'line',
          yAxisIndex: 1,
          data: cumPcts,
          itemStyle: { color: '#ef4444' },
        },
      ],
    };
  }, [campaignBudgetStats]);

  const spendingAnomalies = useMemo(() => {
    const dailyValues = chronologicalSpendData.map((d) => d.daily);
    const anomalies = detectAnomalies(dailyValues, 2.0);
    return anomalies.map((a) => ({
      date: chronologicalSpendData[a.index]?.date,
      spend: a.value,
      zScore: a.zScore.toFixed(2),
      isHigh: a.isHigh,
    }));
  }, [chronologicalSpendData]);

  const [simulatorMultipliers, setSimulatorMultipliers] = useState<Record<string, number>>({});

  const handleMultiplierChange = (campId: string, val: number) => {
    setSimulatorMultipliers((prev) => ({ ...prev, [campId]: val }));
  };

  const resetSimulator = () => {
    setSimulatorMultipliers({});
  };

  const simulatedCampaigns = useMemo(() => {
    return campaignBudgetStats.map((c) => {
      const mult = simulatorMultipliers[c.id] ?? 1.0;
      const proposedBudget = Math.round(c.budget * mult);
      const budgetDelta = proposedBudget - c.budget;

      const projectedConversions = Math.round(c.conversions * Math.sqrt(mult));

      return {
        ...c,
        multiplier: mult,
        proposedBudget,
        budgetDelta,
        projectedConversions,
      };
    });
  }, [campaignBudgetStats, simulatorMultipliers]);

  const simulatedTotalBudget = simulatedCampaigns.reduce((sum, c) => sum + c.proposedBudget, 0);
  const simulatedTotalConversions = simulatedCampaigns.reduce((sum, c) => sum + c.projectedConversions, 0);

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            Budget Intelligence & Capital Efficiency
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Spending trajectory, Pareto concentration, anomaly audits, and non-linear budget modeling.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            exportToCsv(
              'budget_intelligence_report',
              campaignBudgetStats.map((c) => ({
                Campaign: c.name,
                Client: c.clientName,
                Platform: c.platform,
                Budget: c.budget,
                ActualSpend: Math.round(c.spend),
                Utilization: `${c.utilization.toFixed(1)}%`,
                Remaining: c.remaining,
                Conversions: c.conversions,
                CPA: c.cpa,
              }))
            )
          }
          className="text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 shadow-2xs"
        >
          Export Budget Report
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <MetricCard label="Total Budget" value={totalBudget} format="currency" subtext="Configured cap" />
        <MetricCard label="Total Media Spend" value={totalSpend} format="currency" subtext="Actual ad spend" />
        <MetricCard label="Remaining Budget" value={remainingBudget} format="currency" subtext="Unspent allocation" />
        <MetricCard
          label="Budget Utilization"
          value={overallUtilization}
          format="percent"
          subtext="Spend / Budget ratio"
        />
        <MetricCard
          label="Near Threshold"
          value={campaignsNearThreshold}
          format="number"
          subtext="Campaigns ≥ 85% spent"
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Budget Allocation Analytics
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="A. Budget Allocation Treemap"
            subtitle="Hierarchical distribution across Clients and Campaigns"
          >
            <EChartsWrapper option={treemapOption} style={{ height: '300px', width: '100%' }} />
          </ChartContainer>

          <ChartContainer
            title="B. Configured Budget vs. Actual Spend"
            subtitle="Grouped comparison for highest-budgeted campaigns"
          >
            <EChartsWrapper option={budgetVsActualOption} style={{ height: '300px', width: '100%' }} />
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="C. Budget Utilization Leaderboard"
            subtitle="Top utilized campaigns; amber >85%, red >100%"
          >
            <EChartsWrapper option={utilizationOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>

          <ChartContainer
            title="D. Spend vs. Conversions Scatter"
            subtitle="Capital deployed against verified return volume"
          >
            <EChartsWrapper option={spendVsConvOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="E. Daily Expenditure Trajectory"
            subtitle="Chronological daily ad burn rate"
          >
            <EChartsWrapper option={dailyTrendOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>

          <ChartContainer
            title="F. Cumulative Spending Curve"
            subtitle="Continuous running sum of media capital deployed"
          >
            <EChartsWrapper option={cumulativeSpendOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="G. Cost-Efficiency Comparison"
            subtitle="Unit economics ranked across active campaigns"
            metricSelector={{
              value: costMetric,
              options: [
                { label: 'CPA (₹/Conv)', value: 'cpa' },
                { label: 'CPC (₹/Click)', value: 'cpc' },
                { label: 'CPM (₹/1k Views)', value: 'cpm' },
              ],
              onChange: (v: any) => setCostMetric(v),
            }}
          >
            <EChartsWrapper option={costEfficiencyOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>

          <ChartContainer
            title="H. Budget Distribution Histogram"
            subtitle="Frequency distribution of campaign budget brackets"
          >
            <EChartsWrapper option={histogramOption} style={{ height: '280px', width: '100%' }} />
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="I. Spending Concentration (Pareto Lorenz)"
            subtitle="Demonstrates percentage of total budget consumed by top campaigns"
          >
            <EChartsWrapper option={paretoOption} style={{ height: '300px', width: '100%' }} />
          </ChartContainer>

          <div className="bg-white rounded-lg border border-neutral-200/90 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-neutral-900">
                    J. Statistical Spending Anomalies (2-Sigma)
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                  Z-Score &gt; 2.0
                </span>
              </div>
              <p className="text-xs text-neutral-500 mb-4">
                Identifies statistically irregular spending spikes exceeding standard deviation baselines.
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                {spendingAnomalies.length === 0 ? (
                  <div className="py-8 text-center text-neutral-400">
                    No anomalous spending spikes detected in current date window.
                  </div>
                ) : (
                  spendingAnomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border border-amber-200 bg-amber-50/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-amber-950 font-mono">{anom.date}</div>
                        <div className="text-[11px] text-amber-800">
                          Expenditure: ₹{anom.spend.toLocaleString('en-IN')} (Spike)
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-mono font-bold text-[10px]">
                        +{anom.zScore}σ
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] text-neutral-400">
              Transparent baseline computed over chronological daily spend moving average.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200/90 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-neutral-900">Hypothetical Budget Allocation Simulator</h2>
          </div>
          <button
            type="button"
            onClick={resetSimulator}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Multipliers
          </button>
        </div>

        <div className="bg-neutral-50 border border-neutral-200/80 rounded p-3 text-xs text-neutral-600 mb-6 flex items-start gap-2">
          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-neutral-800">Simulation Model Assumptions:</span> This sandbox
            does not modify live ad accounts. Conversions are modeled with realistic non-linear diminishing
            returns where scaling spend produces sub-linear gains due to audience saturation and bidding competition.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 rounded-lg bg-neutral-100/60 border border-neutral-200/60 text-center">
          <div>
            <div className="text-[10px] uppercase text-neutral-500 font-semibold">Current Budget</div>
            <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
              ₹{totalBudget.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500 font-semibold">Simulated Budget</div>
            <div className="text-base font-bold font-mono text-blue-600 mt-0.5">
              ₹{simulatedTotalBudget.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500 font-semibold">Budget Delta</div>
            <div
              className={`text-base font-bold font-mono mt-0.5 ${
                simulatedTotalBudget >= totalBudget ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {simulatedTotalBudget >= totalBudget ? '+' : ''}₹
              {(simulatedTotalBudget - totalBudget).toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500 font-semibold">Projected Conversions</div>
            <div className="text-base font-bold font-mono text-emerald-600 mt-0.5">
              {simulatedTotalConversions.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {simulatedCampaigns.slice(0, 6).map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="min-w-[200px]">
                <div className="font-bold text-neutral-900">{c.name}</div>
                <div className="text-neutral-500 text-[11px]">{c.clientName} · {c.platform}</div>
              </div>

              <div className="flex-1 max-w-xs flex items-center gap-3">
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={c.multiplier}
                  onChange={(e) => handleMultiplierChange(c.id, parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <span className="font-mono font-bold text-neutral-800 w-12 text-right">
                  {c.multiplier.toFixed(2)}x
                </span>
              </div>

              <div className="flex items-center gap-6 font-mono">
                <div className="text-right">
                  <div className="text-[10px] uppercase text-neutral-400">Proposed Budget</div>
                  <div className="font-bold text-neutral-900">₹{c.proposedBudget.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-neutral-400">Projected Conv</div>
                  <div className="font-bold text-emerald-700">{c.projectedConversions.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
