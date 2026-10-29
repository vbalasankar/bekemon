'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import ChartContainer from '@/components/charts/ChartContainer';
import EChartsWrapper, { SWISS_PALETTE } from '@/components/charts/EChartsWrapper';
import { generateInsights } from '@/lib/analytics/insights';
import { exportToCsv } from '@/lib/export/csvExport';
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Filter,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';

export default function InsightsPage() {
  const { campaigns, creatives, filteredObservations } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const allInsights = useMemo(() => {
    return generateInsights(campaigns, creatives, filteredObservations);
  }, [campaigns, creatives, filteredObservations]);

  const filteredInsights = useMemo(() => {
    return allInsights.filter((ins) => {
      if (selectedCategory !== 'ALL' && ins.category !== selectedCategory) return false;
      if (selectedSeverity !== 'ALL' && ins.severity !== selectedSeverity) return false;
      return true;
    });
  }, [allInsights, selectedCategory, selectedSeverity]);

  const categoryDistributionOption = useMemo(() => {
    const counts = new Map<string, number>();
    allInsights.forEach((i) => {
      counts.set(i.category, (counts.get(i.category) || 0) + 1);
    });
    const data = Array.from(counts.entries()).map(([cat, val]) => ({
      name: cat.replace('_', ' '),
      value: val,
    }));

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          data,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
        },
      ],
    };
  }, [allInsights]);

  const severityDistributionOption = useMemo(() => {
    const counts = { POSITIVE: 0, WARNING: 0, INFO: 0, CRITICAL: 0 };
    allInsights.forEach((i) => {
      if (counts[i.severity] !== undefined) counts[i.severity]++;
    });

    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['POSITIVE', 'WARNING', 'INFO'],
        axisLabel: { color: '#737373', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          type: 'bar',
          data: [
            { value: counts.POSITIVE, itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
            { value: counts.WARNING, itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } },
            { value: counts.INFO, itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] } },
          ],
        },
      ],
    };
  }, [allInsights]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              Deterministic Analytics Insights
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Rule-Based Engine
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Mathematical observations derived from aggregated metrics, anomaly detection, and format clustering.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            exportToCsv(
              'bekemon_insights',
              allInsights.map((i) => ({
                Title: i.title,
                Explanation: i.explanation,
                Category: i.category,
                Severity: i.severity,
                SupportingValue: i.supportingValue,
              }))
            )
          }
          className="text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 shadow-2xs"
        >
          Export Insights CSV
        </button>
      </div>

      <div className="bg-white border border-neutral-200/90 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium mr-1">Category:</span>
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Creative Winners', value: 'CREATIVE_WINNER' },
            { label: 'Budget Efficiency', value: 'BUDGET_EFFICIENCY' },
            { label: 'Platform Opportunity', value: 'PLATFORM_OPPORTUNITY' },
            { label: 'Underperformers', value: 'UNDERPERFORMER' },
            { label: 'Data Quality', value: 'DATA_QUALITY' },
          ].map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                selectedCategory === cat.value
                  ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1 text-neutral-700"
          >
            <option value="ALL">All Severities</option>
            <option value="POSITIVE">Positive</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Informational</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Insight Category Distribution"
          subtitle="Proportion of findings across marketing dimensions"
        >
          <EChartsWrapper option={categoryDistributionOption} style={{ height: '260px', width: '100%' }} />
        </ChartContainer>

        <ChartContainer
          title="Severity Breakdown"
          subtitle="Volume of Positive wins vs Performance warnings"
        >
          <EChartsWrapper option={severityDistributionOption} style={{ height: '260px', width: '100%' }} />
        </ChartContainer>
      </div>

      <div className="space-y-3">
        {filteredInsights.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center text-neutral-400">
            No insights match the selected category and severity filters.
          </div>
        ) : (
          filteredInsights.map((ins) => (
            <div
              key={ins.id}
              className={`bg-white rounded-lg border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                ins.severity === 'POSITIVE'
                  ? 'border-l-4 border-l-emerald-500 border-neutral-200/90'
                  : ins.severity === 'WARNING'
                  ? 'border-l-4 border-l-amber-500 border-neutral-200/90'
                  : 'border-l-4 border-l-blue-500 border-neutral-200/90'
              }`}
            >
              <div className="flex items-start gap-3.5 max-w-3xl">
                <div className="mt-1 shrink-0">
                  {ins.severity === 'POSITIVE' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : ins.severity === 'WARNING' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      {ins.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        ins.severity === 'POSITIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ins.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ins.severity}
                    </span>
                  </div>

                  <h3 className="font-bold text-neutral-900 text-sm leading-snug">{ins.title}</h3>
                  <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">{ins.explanation}</p>
                </div>
              </div>

              <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-neutral-100">
                <div className="text-right">
                  <div className="text-[10px] uppercase text-neutral-400 font-semibold">Supporting Value</div>
                  <div className="font-mono font-bold text-neutral-900 text-sm mt-0.5">
                    {ins.supportingValue}
                  </div>
                </div>

                {ins.campaignId && (
                  <Link
                    href={`/campaigns/${ins.campaignId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <span>Inspect Campaign</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
