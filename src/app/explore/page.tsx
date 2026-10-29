'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/context/DataContext';
import ChartContainer from '@/components/charts/ChartContainer';
import EChartsWrapper, {
  PLATFORM_COLORS,
  STYLE_COLORS,
  SWISS_PALETTE,
} from '@/components/charts/EChartsWrapper';
import { aggregateObservations, computeBoxPlotStats } from '@/lib/analytics/metrics';
import { exportToCsv } from '@/lib/export/csvExport';
import {
  PieChart,
  Save,
  Trash2,
  BookmarkCheck,
  Sliders,
  Sparkles,
  Download,
  Info,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { SavedView } from '@/types';

export default function VisualExplorerPage() {
  const {
    campaigns,
    creatives,
    filteredObservations,
    savedViews,
    saveView,
    deleteView,
  } = useData();

  const [dataset, setDataset] = useState<'campaigns' | 'creatives' | 'daily' | 'platforms' | 'styles'>('styles');
  const [chartType, setChartType] = useState<
    'bar' | 'line' | 'scatter' | 'donut' | 'treemap' | 'boxplot' | 'stacked_bar'
  >('bar');
  const [xAxis, setXAxis] = useState<string>('visualStyle');
  const [yAxis, setYAxis] = useState<string>('ctr');
  const [groupBy, setGroupBy] = useState<string>('none');

  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const campaignMap = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);
  const creativeMap = useMemo(() => new Map(creatives.map((c) => [c.id, c])), [creatives]);

  const compatibilityWarning = useMemo(() => {
    if (chartType === 'line' && xAxis !== 'date') {
      return 'Line charts are best suited for chronological time series (e.g. Date on X-axis).';
    }
    if (chartType === 'treemap' && (xAxis === 'date' || yAxis === 'ctr')) {
      return 'Treemaps represent hierarchical additive sums (e.g. Spend or Impressions), not ratios or dates.';
    }
    if (chartType === 'boxplot' && (xAxis === 'date' || yAxis === 'spend')) {
      return 'Box plots compare distributions across categorical groups (e.g. Visual Style, Character Usage).';
    }
    return null;
  }, [chartType, xAxis, yAxis]);

  const dynamicOption = useMemo(() => {

    if (dataset === 'styles') {
      const styleGroups = new Map<string, typeof filteredObservations>();
      for (const obs of filteredObservations) {
        const cr = creativeMap.get(obs.creativeId);
        if (!cr) continue;
        const key = cr.visualStyle;
        if (!styleGroups.has(key)) styleGroups.set(key, []);
        styleGroups.get(key)!.push(obs);
      }

      const styles = Array.from(styleGroups.keys());
      const values = styles.map((st) => {
        const list = styleGroups.get(st)!;
        const agg = aggregateObservations(list);
        const val = (agg as any)[yAxis] ?? 0;
        return Number(val.toFixed(2));
      });

      if (chartType === 'donut') {
        return {
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          series: [
            {
              type: 'pie',
              radius: ['40%', '70%'],
              data: styles.map((st, i) => ({
                name: st,
                value: values[i],
                itemStyle: { color: STYLE_COLORS[st] || SWISS_PALETTE[i % SWISS_PALETTE.length] },
              })),
            },
          ],
        };
      }

      if (chartType === 'treemap') {
        return {
          tooltip: { formatter: '{b}: {c}' },
          series: [
            {
              type: 'treemap',
              data: styles.map((st, i) => ({ name: st, value: values[i] })),
            },
          ],
        };
      }

      return {
        grid: { left: '4%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: styles, axisLabel: { color: '#737373', fontSize: 10, rotate: 15 } },
        yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
        series: [
          {
            name: yAxis.toUpperCase(),
            type: chartType === 'line' ? 'line' : 'bar',
            data: styles.map((st, i) => ({
              value: values[i],
              itemStyle: { color: STYLE_COLORS[st] || '#2563eb', borderRadius: [4, 4, 0, 0] },
            })),
          },
        ],
      };
    }

    if (dataset === 'daily') {
      const dateMap = new Map<string, typeof filteredObservations>();
      for (const obs of filteredObservations) {
        if (!dateMap.has(obs.date)) dateMap.set(obs.date, []);
        dateMap.get(obs.date)!.push(obs);
      }
      const dates = Array.from(dateMap.keys()).sort();

      if (groupBy === 'platform') {
        const platforms = ['Meta', 'Google Ads', 'TikTok', 'YouTube', 'LinkedIn'];
        const series = platforms.map((plat) => {
          const values = dates.map((d) => {
            const list = (dateMap.get(d) || []).filter((o) => o.platform === plat);
            if (list.length === 0) return 0;
            const agg = aggregateObservations(list);
            return Number(((agg as any)[yAxis] ?? 0).toFixed(2));
          });
          return {
            name: plat,
            type: chartType === 'bar' ? 'bar' : 'line',
            stack: chartType === 'stacked_bar' ? 'total' : undefined,
            data: values,
            itemStyle: { color: PLATFORM_COLORS[plat] || '#64748b' },
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
      }

      const values = dates.map((d) => {
        const list = dateMap.get(d) || [];
        const agg = aggregateObservations(list);
        return Number(((agg as any)[yAxis] ?? 0).toFixed(2));
      });

      return {
        grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dates, axisLabel: { color: '#737373', fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
        series: [
          {
            name: yAxis.toUpperCase(),
            type: chartType === 'bar' ? 'bar' : 'line',
            data: values,
            itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] },
          },
        ],
      };
    }

    const campMap = new Map<string, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      if (!campMap.has(obs.campaignId)) campMap.set(obs.campaignId, []);
      campMap.get(obs.campaignId)!.push(obs);
    }

    const cLookup = new Map(campaigns.map((c) => [c.id, c]));
    const campList = Array.from(campMap.entries()).map(([cId, list]) => {
      const camp = cLookup.get(cId);
      const agg = aggregateObservations(list);
      return {
        name: camp?.name || cId,
        platform: camp?.platform || 'Meta',
        spend: agg.spend,
        conversions: agg.conversions,
        ctr: agg.ctr || 0,
        cpc: agg.cpc || 0,
        cpa: agg.costPerConversion || 0,
        impressions: agg.impressions,
      };
    });

    if (chartType === 'scatter') {
      return {
        grid: { left: '6%', right: '6%', bottom: '10%', top: '10%', containLabel: true },
        tooltip: {
          formatter: (p: any) =>
            `<b>${campList[p.dataIndex]?.name}</b><br/>${xAxis.toUpperCase()}: ${p.value[0]}<br/>${yAxis.toUpperCase()}: ${p.value[1]}`,
        },
        xAxis: { name: xAxis.toUpperCase(), type: 'value', axisLabel: { color: '#737373', fontSize: 10 } },
        yAxis: { name: yAxis.toUpperCase(), type: 'value', axisLabel: { color: '#737373', fontSize: 10 } },
        series: [
          {
            type: 'scatter',
            symbolSize: 14,
            data: campList.map((c) => [(c as any)[xAxis] ?? 0, (c as any)[yAxis] ?? 0]),
            itemStyle: { color: '#2563eb' },
          },
        ],
      };
    }

    const top10 = campList.slice(0, 10);
    return {
      grid: { left: '4%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: top10.map((c) => (c.name.length > 14 ? c.name.slice(0, 12) + '...' : c.name)),
        axisLabel: { color: '#737373', fontSize: 9, rotate: 15 },
      },
      yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      series: [
        {
          type: 'bar',
          data: top10.map((c) => (c as any)[yAxis] ?? 0),
          itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [dataset, chartType, xAxis, yAxis, groupBy, filteredObservations, creativeMap, campaignMap, campaigns]);

  const handleLoadSavedView = (view: SavedView) => {
    setDataset(view.dataset);
    setChartType(view.chartType as any);
    setXAxis(view.xAxis);
    setYAxis(view.yAxis);
    setGroupBy(view.groupBy);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">Visual Explorer</h1>
            <span className="bg-neutral-900 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
              Custom Chart Builder
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Construct arbitrary ad metrics visualizations across dimensions, group by factors, and save views.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-md hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Custom View</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          <span>Chart Configuration Matrix</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 text-xs">

          <div>
            <label className="font-semibold text-neutral-600 block mb-1">Dataset</label>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value as any)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 font-medium text-neutral-800"
            >
              <option value="styles">Creative Styles</option>
              <option value="daily">Daily Performance</option>
              <option value="campaigns">Campaigns</option>
              <option value="platforms">Platforms</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-neutral-600 block mb-1">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 font-medium text-neutral-800"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="scatter">Scatter Plot</option>
              <option value="stacked_bar">Stacked Bar</option>
              <option value="donut">Donut Share</option>
              <option value="treemap">Treemap</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-neutral-600 block mb-1">X-Axis Dimension</label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 font-medium text-neutral-800"
            >
              <option value="visualStyle">Creative Style</option>
              <option value="date">Date</option>
              <option value="platform">Platform</option>
              <option value="spend">Spend</option>
              <option value="impressions">Impressions</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-neutral-600 block mb-1">Y-Axis Metric</label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 font-medium text-neutral-800"
            >
              <option value="ctr">CTR (%)</option>
              <option value="spend">Spend (₹)</option>
              <option value="conversions">Conversions</option>
              <option value="costPerConversion">Cost / Conv (₹)</option>
              <option value="cpc">CPC (₹)</option>
              <option value="clicks">Clicks</option>
              <option value="impressions">Impressions</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-neutral-600 block mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 font-medium text-neutral-800"
            >
              <option value="none">None (Total)</option>
              <option value="platform">Platform</option>
            </select>
          </div>
        </div>

        {compatibilityWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{compatibilityWarning}</span>
          </div>
        )}
      </div>

      <ChartContainer
        title={`Custom View: ${dataset.toUpperCase()} · ${yAxis.toUpperCase()} by ${xAxis}`}
        subtitle={`Generated via BEKEMON Visual Explorer (${chartType})`}
        onExportCsv={() => exportToCsv(`custom_view_${dataset}_${yAxis}`, [{ metric: yAxis, dimension: xAxis }])}
      >
        <EChartsWrapper option={dynamicOption} style={{ height: '380px', width: '100%' }} />
      </ChartContainer>

      <div className="bg-white rounded-lg border border-neutral-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-neutral-700" />
            <h2 className="text-sm font-bold text-neutral-900">Saved Custom Views Library</h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">{savedViews.length} views stored</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {savedViews.map((v) => (
            <div
              key={v.id}
              className="p-3.5 rounded-lg border border-neutral-200/80 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-neutral-900">{v.name}</div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  {v.dataset} · {v.chartType} ({v.yAxis} vs {v.xAxis})
                </div>
                {v.description && (
                  <p className="text-[11px] text-neutral-600 mt-1 line-clamp-1">{v.description}</p>
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleLoadSavedView(v)}
                  className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Load in Builder
                </button>
                <button
                  type="button"
                  onClick={() => deleteView(v.id)}
                  className="text-neutral-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                  title="Delete View"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Save Current View</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Persist this custom chart matrix to your local workspace views library.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!saveTitle.trim()) return;
                saveView({
                  name: saveTitle.trim(),
                  dataset,
                  chartType,
                  xAxis,
                  yAxis,
                  groupBy,
                  metric: yAxis,
                  description: `${yAxis.toUpperCase()} by ${xAxis} (${chartType})`,
                });
                setSaveTitle('');
                setShowSaveModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">View Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cartoon CTR Breakdown by Platform"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded text-neutral-900"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 border border-neutral-200 rounded text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!saveTitle.trim()}
                  className="px-4 py-1.5 bg-neutral-900 text-white rounded font-medium disabled:opacity-40"
                >
                  Save View
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
