'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import ChartContainer from '@/components/charts/ChartContainer';
import EChartsWrapper, {
  STYLE_COLORS,
  PLATFORM_COLORS,
  SWISS_PALETTE,
} from '@/components/charts/EChartsWrapper';
import MetricCard from '@/components/common/MetricCard';
import {
  aggregateObservations,
  calculateCTR,
  calculateCostPerConversion,
  computeBoxPlotStats,
} from '@/lib/analytics/metrics';
import { exportToCsv } from '@/lib/export/csvExport';
import {
  Sparkles,
  Filter,
  Search,
  SlidersHorizontal,
  Edit3,
  Check,
  X,
  Play,
  Film,
  Info,
  Clock,
  Layers,
  BarChart2,
  PieChart,
  Grid,
} from 'lucide-react';
import {
  Creative,
  VisualStyle,
  AnimationStyle,
  CharacterUsage,
  CreativeFormat,
  AspectRatio,
} from '@/types';

export default function CreativeLabPage() {
  const {
    creatives,
    campaigns,
    filteredObservations,
    updateCreative,
  } = useData();

  const [activeTab, setActiveTab] = useState<'visualizations' | 'gallery' | 'leaderboard'>('visualizations');

  const [gallerySearch, setGallerySearch] = useState('');
  const [styleFilter, setStyleFilter] = useState<string>('ALL');
  const [formatFilter, setFormatFilter] = useState<string>('ALL');

  const [visAMetric, setVisAMetric] = useState<string>('ctr');

  const [visBMetric, setVisBMetric] = useState<string>('ctr');

  const [visCMetric, setVisCMetric] = useState<string>('ctr');

  const [visDMetric, setVisDMetric] = useState<string>('ctr');

  const [visEMetric, setVisEMetric] = useState<string>('ctr');

  const [visFMetric, setVisFMetric] = useState<string>('ctr');

  const [selectedCreativeIds, setSelectedCreativeIds] = useState<string[]>(['crt-201', 'crt-209']);
  const [visHMetric, setVisHMetric] = useState<string>('ctr');

  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);

  const campaignMap = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);
  const creativeMap = useMemo(() => new Map(creatives.map((c) => [c.id, c])), [creatives]);

  const creativeMetricsList = useMemo(() => {
    const crObsMap = new Map<string, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      if (!crObsMap.has(obs.creativeId)) crObsMap.set(obs.creativeId, []);
      crObsMap.get(obs.creativeId)!.push(obs);
    }

    return creatives.map((cr) => {
      const list = crObsMap.get(cr.id) || [];
      const agg = aggregateObservations(list);
      const camp = campaignMap.get(cr.campaignId);

      return {
        creative: cr,
        campaign: camp,
        metrics: agg,
        observationsCount: list.length,
      };
    });
  }, [creatives, filteredObservations, campaignMap]);

  const visAOption = useMemo(() => {
    const styleGroups = new Map<VisualStyle, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      const cr = creativeMap.get(obs.creativeId);
      if (!cr) continue;
      if (!styleGroups.has(cr.visualStyle)) styleGroups.set(cr.visualStyle, []);
      styleGroups.get(cr.visualStyle)!.push(obs);
    }

    const styles = Array.from(styleGroups.keys());
    const dataPoints = styles.map((st) => {
      const list = styleGroups.get(st)!;
      const agg = aggregateObservations(list);
      let val = 0;
      if (visAMetric === 'ctr') val = agg.ctr || 0;
      else if (visAMetric === 'cpc') val = agg.cpc || 0;
      else if (visAMetric === 'costPerConversion') val = agg.costPerConversion || 0;
      else if (visAMetric === 'conversionRate') val = agg.conversionRate || 0;
      else if (visAMetric === 'engagementRate') val = agg.engagementRate || 0;
      else if (visAMetric === 'videoCompletionRate') val = agg.videoCompletionRate || 0;

      return {
        name: st,
        value: Number(val.toFixed(2)),
        count: list.length,
        itemStyle: { color: STYLE_COLORS[st] || '#64748b' },
      };
    });

    dataPoints.sort((a, b) => b.value - a.value);

    return {
      grid: { left: '4%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          if (!params || !params[0]) return '';
          const p = params[0];
          const unit = visAMetric === 'cpc' || visAMetric === 'costPerConversion' ? '₹' : '%';
          return `<div class="font-sans">
            <div class="font-bold text-white text-xs">${p.name}</div>
            <div class="text-xs text-neutral-300 mt-1">${p.seriesName}: <b>${
            unit === '₹' ? `₹${p.value}` : `${p.value}%`
          }</b></div>
            <div class="text-[10px] text-neutral-400 mt-0.5">Sample Size: ${p.data.count} observations</div>
          </div>`;
        },
      },
      xAxis: {
        type: 'category',
        data: dataPoints.map((d) => d.name),
        axisLabel: { color: '#737373', fontSize: 10, rotate: 15 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#737373',
          fontSize: 10,
          formatter: (v: number) => (visAMetric === 'cpc' || visAMetric === 'costPerConversion' ? `₹${v}` : `${v}%`),
        },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          name: visAMetric.toUpperCase(),
          type: 'bar',
          data: dataPoints,
          borderRadius: [4, 4, 0, 0],
        },
      ],
    };
  }, [filteredObservations, creativeMap, visAMetric]);

  const visBOption = useMemo(() => {
    const styles: VisualStyle[] = [
      '2D Cartoon',
      '3D Animation',
      'Anime-Inspired',
      'Hand-Drawn Illustration',
      'Motion Graphics',
      'Live Action',
      'Mixed Media',
    ];
    const objectives = ['CONVERSIONS', 'BRAND_AWARENESS', 'LEAD_GENERATION', 'VIDEO_VIEWS', 'ENGAGEMENT', 'TRAFFIC'];

    const cellMap = new Map<string, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      const cr = creativeMap.get(obs.creativeId);
      const camp = campaignMap.get(obs.campaignId);
      if (!cr || !camp) continue;
      const key = `${cr.visualStyle}__${camp.objective}`;
      if (!cellMap.has(key)) cellMap.set(key, []);
      cellMap.get(key)!.push(obs);
    }

    const data: [number, number, number | null, number][] = [];
    let maxVal = 0;

    styles.forEach((st, sIdx) => {
      objectives.forEach((obj, oIdx) => {
        const key = `${st}__${obj}`;
        const obsList = cellMap.get(key);
        if (!obsList || obsList.length === 0) {
          data.push([oIdx, sIdx, null, 0]);
        } else {
          const agg = aggregateObservations(obsList);
          let val = 0;
          if (visBMetric === 'ctr') val = agg.ctr || 0;
          else if (visBMetric === 'cpc') val = agg.cpc || 0;
          else if (visBMetric === 'costPerConversion') val = agg.costPerConversion || 0;
          else if (visBMetric === 'conversionRate') val = agg.conversionRate || 0;

          if (val > maxVal) maxVal = val;
          data.push([oIdx, sIdx, Number(val.toFixed(2)), obsList.length]);
        }
      });
    });

    return {
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [oIdx, sIdx, val, count] = params.value;
          const style = styles[sIdx];
          const obj = objectives[oIdx];
          if (val === null) {
            return `<b>${style}</b> · ${obj}<br/><span class="text-neutral-400">No observed data for this pairing</span>`;
          }
          const unit = visBMetric === 'cpc' || visBMetric === 'costPerConversion' ? '₹' : '%';
          return `<div class="font-sans">
            <div class="font-bold text-white text-xs">${style}</div>
            <div class="text-[11px] text-neutral-300">Objective: ${obj}</div>
            <div class="text-xs font-semibold mt-1">${visBMetric.toUpperCase()}: ${
            unit === '₹' ? `₹${val}` : `${val}%`
          }</div>
            <div class="text-[10px] text-neutral-400">Sample size: ${count} observations</div>
          </div>`;
        },
      },
      grid: { left: '16%', right: '4%', bottom: '15%', top: '8%', containLabel: false },
      xAxis: {
        type: 'category',
        data: objectives.map((o) => o.replace('_', ' ')),
        splitArea: { show: true },
        axisLabel: { color: '#737373', fontSize: 10, rotate: 15 },
      },
      yAxis: {
        type: 'category',
        data: styles,
        splitArea: { show: true },
        axisLabel: { color: '#737373', fontSize: 10 },
      },
      visualMap: {
        min: 0,
        max: maxVal > 0 ? Number(maxVal.toFixed(1)) : 5,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: { color: ['#eff6ff', '#60a5fa', '#1e40af'] },
        textStyle: { fontSize: 10, color: '#737373' },
      },
      series: [
        {
          type: 'heatmap',
          data: data.map((d) => [d[0], d[1], d[2] ?? '-']),
          label: {
            show: true,
            formatter: (p: any) => (p.value[2] === '-' ? 'N/A' : p.value[2]),
            fontSize: 9,
            color: '#1e293b',
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 1.5,
          },
        },
      ],
    };
  }, [filteredObservations, creativeMap, campaignMap, visBMetric]);

  const visCOption = useMemo(() => {
    const buckets = [
      { label: '<6s', min: 0, max: 6 },
      { label: '6–15s', min: 6, max: 15 },
      { label: '16–30s', min: 16, max: 30 },
      { label: '31–60s', min: 31, max: 60 },
      { label: '>60s', min: 61, max: 999 },
    ];

    const bucketData = buckets.map((b) => {
      const matchingObs = filteredObservations.filter((obs) => {
        const cr = creativeMap.get(obs.creativeId);
        if (!cr || cr.durationSeconds === null) return false;
        return cr.durationSeconds >= b.min && cr.durationSeconds <= b.max;
      });

      const agg = aggregateObservations(matchingObs);
      let val = 0;
      if (visCMetric === 'ctr') val = agg.ctr || 0;
      else if (visCMetric === 'costPerConversion') val = agg.costPerConversion || 0;
      else if (visCMetric === 'conversionRate') val = agg.conversionRate || 0;
      else if (visCMetric === 'videoCompletionRate') val = agg.videoCompletionRate || 0;

      return {
        name: b.label,
        value: Number(val.toFixed(2)),
        sampleSize: matchingObs.length,
      };
    });

    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}: ${p.value}% (Sample: ${p.data.sampleSize} obs)`;
        },
      },
      xAxis: {
        type: 'category',
        data: bucketData.map((b) => b.name),
        axisLabel: { color: '#737373', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          type: 'bar',
          data: bucketData,
          itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [filteredObservations, creativeMap, visCMetric]);

  const visDOption = useMemo(() => {
    const styleGroups = new Map<VisualStyle, number[]>();
    for (const obs of filteredObservations) {
      const cr = creativeMap.get(obs.creativeId);
      if (!cr) continue;
      if (!styleGroups.has(cr.visualStyle)) styleGroups.set(cr.visualStyle, []);

      let metricVal = 0;
      if (visDMetric === 'ctr') metricVal = obs.impressions > 0 ? (obs.clicks / obs.impressions) * 100 : 0;
      else if (visDMetric === 'cpc') metricVal = obs.clicks > 0 ? obs.spend / obs.clicks : 0;
      else if (visDMetric === 'costPerConversion') metricVal = obs.conversions > 0 ? obs.spend / obs.conversions : 0;

      if (metricVal > 0 && metricVal < 500) {
        styleGroups.get(cr.visualStyle)!.push(metricVal);
      }
    }

    const categories = Array.from(styleGroups.keys());
    const boxData = categories.map((cat) => computeBoxPlotStats(styleGroups.get(cat)!) || [0, 0, 0, 0, 0]);

    return {
      grid: { left: '4%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      tooltip: {
        trigger: 'item',
        formatter: (param: any) => {
          return `<div class="font-sans">
            <div class="font-bold text-white text-xs">${param.name}</div>
            <div class="text-[11px] text-neutral-300 mt-1">
              Max: ${param.data[5]}<br/>
              Q3: ${param.data[4]}<br/>
              Median: ${param.data[3]}<br/>
              Q1: ${param.data[2]}<br/>
              Min: ${param.data[1]}
            </div>
          </div>`;
        },
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: '#737373', fontSize: 10, rotate: 15 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          name: 'Distribution',
          type: 'boxplot',
          data: boxData,
          itemStyle: { borderColor: '#2563eb', borderWidth: 1.5 },
        },
      ],
    };
  }, [filteredObservations, creativeMap, visDMetric]);

  const visEOption = useMemo(() => {
    const list = [...creativeMetricsList];
    list.sort((a, b) => {
      const valA = (a.metrics as any)[visEMetric] ?? 0;
      const valB = (b.metrics as any)[visEMetric] ?? 0;
      return valB - valA;
    });

    const top8 = list.slice(0, 8).reverse();

    return {
      grid: { left: '4%', right: '8%', bottom: '6%', top: '4%', containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      yAxis: {
        type: 'category',
        data: top8.map((item) => (item.creative.name.length > 20 ? item.creative.name.slice(0, 18) + '...' : item.creative.name)),
        axisLabel: { color: '#737373', fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: top8.map((item) => {
            const v = (item.metrics as any)[visEMetric] ?? 0;
            return {
              value: Number(v.toFixed(2)),
              itemStyle: { color: STYLE_COLORS[item.creative.visualStyle] || '#2563eb', borderRadius: [0, 4, 4, 0] },
            };
          }),
        },
      ],
    };
  }, [creativeMetricsList, visEMetric]);

  const visFOption = useMemo(() => {
    const dataPoints = creativeMetricsList
      .filter((item) => item.metrics.spend > 0)
      .map((item) => {
        const yVal = (item.metrics as any)[visFMetric] ?? 0;
        return {
          name: item.creative.name,
          style: item.creative.visualStyle,
          value: [Math.round(item.metrics.spend), Number(yVal.toFixed(2)), item.metrics.impressions],
          itemStyle: { color: STYLE_COLORS[item.creative.visualStyle] || '#64748b' },
        };
      });

    return {
      grid: { left: '6%', right: '6%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: {
        formatter: (p: any) =>
          `<div class="font-sans">
            <div class="font-bold text-white text-xs">${p.data.name}</div>
            <div class="text-[11px] text-neutral-400">${p.data.style}</div>
            <div class="mt-1 text-xs">Spend: ₹${p.value[0].toLocaleString('en-IN')}<br/>${visFMetric.toUpperCase()}: ${p.value[1]}%</div>
          </div>`,
      },
      xAxis: {
        name: 'Spend (₹)',
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10, formatter: (v: number) => `₹${v >= 100000 ? `${(v/100000).toFixed(1)}L` : `${v/1000}k`}` },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      yAxis: {
        name: visFMetric.toUpperCase(),
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          type: 'scatter',
          symbolSize: (val: number[]) => Math.min(36, Math.max(8, Math.sqrt(val[2]) / 20)),
          data: dataPoints,
        },
      ],
    };
  }, [creativeMetricsList, visFMetric]);

  const visGOption = useMemo(() => {
    const formatCounts = new Map<string, { spend: number; count: number }>();
    for (const item of creativeMetricsList) {
      const f = item.creative.creativeFormat.replace('_', ' ');
      if (!formatCounts.has(f)) formatCounts.set(f, { spend: 0, count: 0 });
      const current = formatCounts.get(f)!;
      current.spend += item.metrics.spend;
      current.count++;
    }

    const treeData = Array.from(formatCounts.entries()).map(([format, data]) => ({
      name: format,
      value: Math.round(data.spend),
      count: data.count,
    }));

    return {
      tooltip: {
        formatter: (p: any) =>
          `${p.name}<br/>Spend: ₹${p.value.toLocaleString('en-IN')}<br/>Creatives: ${p.data.count}`,
      },
      series: [
        {
          type: 'treemap',
          data: treeData,
          leafDepth: 1,
          roam: false,
          label: { show: true, formatter: '{b}\n₹{c}' },
          itemStyle: { borderColor: '#fff' },
        },
      ],
    };
  }, [creativeMetricsList]);

  const visHOption = useMemo(() => {
    const dateSet = new Set<string>();
    filteredObservations.forEach((o) => dateSet.add(o.date));
    const dates = Array.from(dateSet).sort();

    const series = selectedCreativeIds.map((crId, idx) => {
      const cr = creativeMap.get(crId);
      const crObs = filteredObservations.filter((o) => o.creativeId === crId);
      const obsByDate = new Map(crObs.map((o) => [o.date, o]));

      const values = dates.map((d) => {
        const o = obsByDate.get(d);
        if (!o) return 0;
        if (visHMetric === 'ctr') return o.impressions > 0 ? Number(((o.clicks / o.impressions) * 100).toFixed(2)) : 0;
        if (visHMetric === 'spend') return o.spend;
        if (visHMetric === 'conversions') return o.conversions;
        return 0;
      });

      return {
        name: cr?.name || crId,
        type: 'line',
        smooth: true,
        data: values,
        itemStyle: { color: SWISS_PALETTE[idx % SWISS_PALETTE.length] },
      };
    });

    return {
      grid: { left: '4%', right: '4%', bottom: '12%', top: '14%', containLabel: true },
      tooltip: { trigger: 'axis' },
      legend: { textStyle: { fontSize: 10, color: '#737373' } },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { color: '#737373', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series,
    };
  }, [filteredObservations, selectedCreativeIds, creativeMap, visHMetric]);

  const visIOption = useMemo(() => {
    const charMap = new Map<CharacterUsage, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      const cr = creativeMap.get(obs.creativeId);
      if (!cr) continue;
      if (!charMap.has(cr.characterUsage)) charMap.set(cr.characterUsage, []);
      charMap.get(cr.characterUsage)!.push(obs);
    }

    const data = Array.from(charMap.entries()).map(([char, list]) => {
      const agg = aggregateObservations(list);
      return {
        name: char,
        ctr: agg.ctr ? Number(agg.ctr.toFixed(2)) : 0,
        cpa: agg.costPerConversion ? Number(agg.costPerConversion.toFixed(2)) : 0,
        count: list.length,
      };
    });

    data.sort((a, b) => b.ctr - a.ctr);

    return {
      grid: { left: '4%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `<b>${p.name}</b><br/>CTR: ${p.data.ctr}%<br/>Cost/Conv: ₹${p.data.cpa}<br/>Sample: ${p.data.count} obs`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLabel: { color: '#737373', fontSize: 10, rotate: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          name: 'CTR (%)',
          type: 'bar',
          data: data.map((d) => ({ value: d.ctr, ...d })),
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [filteredObservations, creativeMap]);

  const visJOption = useMemo(() => {
    const ratioMap = new Map<AspectRatio, typeof filteredObservations>();
    for (const obs of filteredObservations) {
      const cr = creativeMap.get(obs.creativeId);
      if (!cr) continue;
      if (!ratioMap.has(cr.aspectRatio)) ratioMap.set(cr.aspectRatio, []);
      ratioMap.get(cr.aspectRatio)!.push(obs);
    }

    const ratios = Array.from(ratioMap.keys());
    const data = ratios.map((r) => {
      const list = ratioMap.get(r)!;
      const agg = aggregateObservations(list);
      return {
        name: r,
        ctr: agg.ctr ? Number(agg.ctr.toFixed(2)) : 0,
        spend: Math.round(agg.spend),
      };
    });

    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => `${params[0].name}: ${params[0].value}% CTR`,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLabel: { color: '#737373', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#737373', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          name: 'CTR',
          type: 'bar',
          data: data.map((d) => d.ctr),
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [filteredObservations, creativeMap]);

  const filteredGallery = useMemo(() => {
    return creativeMetricsList.filter((item) => {
      if (styleFilter !== 'ALL' && item.creative.visualStyle !== styleFilter) return false;
      if (formatFilter !== 'ALL' && item.creative.creativeFormat !== formatFilter) return false;
      if (gallerySearch.trim()) {
        const q = gallerySearch.toLowerCase();
        return (
          item.creative.name.toLowerCase().includes(q) ||
          item.creative.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [creativeMetricsList, styleFilter, formatFilter, gallerySearch]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">Creative Lab</h1>
            <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Signature Intelligence
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Deep visual analytics for 2D/3D cartoon ads, anime aesthetics, mascot marketing, and motion assets.
          </p>
        </div>

        <div className="flex items-center bg-neutral-100 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('visualizations')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'visualizations' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-600'
            }`}
          >
            Visual Analytics (A–J)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'gallery' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-600'
            }`}
          >
            Creative Gallery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'leaderboard' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-600'
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold">Observational Intelligence Disclaimer:</span> Creative-style
          comparisons reflect observed ad performance in specific campaigns. A higher CTR or lower CPA for
          cartoon and mascot creatives indicates strong resonance in this dataset, but does not prove direct
          causality. Audience targeting, platform distribution, and budget interact with creative format.
        </p>
      </div>

      {activeTab === 'visualizations' && (
        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="A. Creative-Style Performance Comparison"
              subtitle="Weighted performance aggregate by visual animation/styling format"
              infoTooltip="Compares visual style performance with zero denominator protection. Never averages averages."
              metricSelector={{
                value: visAMetric,
                options: [
                  { label: 'CTR (%)', value: 'ctr' },
                  { label: 'CPC (₹)', value: 'cpc' },
                  { label: 'Cost Per Conversion (₹)', value: 'costPerConversion' },
                  { label: 'Conversion Rate (%)', value: 'conversionRate' },
                  { label: 'Engagement Rate (%)', value: 'engagementRate' },
                  { label: 'Video Completion (%)', value: 'videoCompletionRate' },
                ],
                onChange: setVisAMetric,
              }}
              isEmpty={filteredObservations.length === 0}
            >
              <EChartsWrapper option={visAOption} style={{ height: '300px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="B. Creative-Style vs. Objective Heatmap"
              subtitle="Interactions between aesthetic styling and campaign marketing objectives"
              infoTooltip="Rows are visual styles, columns are objectives. Shows sample sizes and distinguishes missing data from zero."
              metricSelector={{
                value: visBMetric,
                options: [
                  { label: 'CTR (%)', value: 'ctr' },
                  { label: 'Cost / Conv (₹)', value: 'costPerConversion' },
                  { label: 'CPC (₹)', value: 'cpc' },
                  { label: 'CVR (%)', value: 'conversionRate' },
                ],
                onChange: setVisBMetric,
              }}
              isEmpty={filteredObservations.length === 0}
            >
              <EChartsWrapper option={visBOption} style={{ height: '300px', width: '100%' }} />
            </ChartContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="C. Creative Duration Bracket Analysis"
              subtitle="Performance variation grouped into duration intervals (<6s, 6-15s, 16-30s, etc.)"
              infoTooltip="Evaluates video ad retention and conversion efficiency across length brackets."
              metricSelector={{
                value: visCMetric,
                options: [
                  { label: 'CTR (%)', value: 'ctr' },
                  { label: 'Cost / Conv (₹)', value: 'costPerConversion' },
                  { label: 'CVR (%)', value: 'conversionRate' },
                  { label: 'Video Completion (%)', value: 'videoCompletionRate' },
                ],
                onChange: setVisCMetric,
              }}
              isEmpty={filteredObservations.length === 0}
            >
              <EChartsWrapper option={visCOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="D. Performance Distribution (Box Plots)"
              subtitle="Shows median, IQR spread, and outliers across creative categories"
              infoTooltip="Helps evaluate whether a category's performance is consistent or driven by a few extreme outliers."
              metricSelector={{
                value: visDMetric,
                options: [
                  { label: 'CTR (%)', value: 'ctr' },
                  { label: 'CPC (₹)', value: 'cpc' },
                  { label: 'Cost Per Conversion (₹)', value: 'costPerConversion' },
                ],
                onChange: setVisDMetric,
              }}
              isEmpty={filteredObservations.length === 0}
            >
              <EChartsWrapper option={visDOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="E. Creative Leaderboard Ranked Bars"
              subtitle="Horizontal ranked bar chart of top performing individual creative assets"
              metricSelector={{
                value: visEMetric,
                options: [
                  { label: 'CTR (%)', value: 'ctr' },
                  { label: 'Total Conversions', value: 'conversions' },
                  { label: 'Total Clicks', value: 'clicks' },
                ],
                onChange: setVisEMetric,
              }}
              isEmpty={creativeMetricsList.length === 0}
            >
              <EChartsWrapper option={visEOption} style={{ height: '300px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="F. Creative Efficiency Scatter Plot"
              subtitle="Spend vs Rate with bubble size proportional to impressions"
              infoTooltip="Color grouped by creative visual style to isolate performance clusters."
              metricSelector={{
                value: visFMetric,
                options: [
                  { label: 'CTR (%)', value: 'ctr' },
                  { label: 'CVR (%)', value: 'conversionRate' },
                ],
                onChange: setVisFMetric,
              }}
              isEmpty={creativeMetricsList.length === 0}
            >
              <EChartsWrapper option={visFOption} style={{ height: '300px', width: '100%' }} />
            </ChartContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="G. Creative Format Distribution"
              subtitle="Treemap breakdown of spend across Animation, Video, Carousel, and Static formats"
              isEmpty={creativeMetricsList.length === 0}
            >
              <EChartsWrapper option={visGOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="H. Multi-Creative Performance Over Time"
              subtitle="Daily trajectory comparison between selected creative assets"
              metricSelector={{
                value: visHMetric,
                options: [
                  { label: 'CTR (%)', value: 'ctr' },
                  { label: 'Daily Spend (₹)', value: 'spend' },
                  { label: 'Conversions', value: 'conversions' },
                ],
                onChange: setVisHMetric,
              }}
              isEmpty={filteredObservations.length === 0}
            >
              <EChartsWrapper option={visHOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="I. Character & Mascot Usage Comparison"
              subtitle="Impact of Brand Mascots vs Cartoon Characters vs No Characters"
              infoTooltip="Demonstrates whether persona-driven creatives produce higher engagement rates."
              isEmpty={filteredObservations.length === 0}
            >
              <EChartsWrapper option={visIOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="J. Aspect Ratio Performance Analysis"
              subtitle="Comparing 9:16 vertical, 1:1 square, 4:5 social, and 16:9 widescreen"
              isEmpty={filteredObservations.length === 0}
            >
              <EChartsWrapper option={visJOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>
          </div>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="space-y-4">

          <div className="bg-white border border-neutral-200/90 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter gallery by creative title or tag..."
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-md bg-neutral-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 focus:outline-hidden"
              >
                <option value="ALL">All Styles</option>
                <option value="2D Cartoon">2D Cartoon</option>
                <option value="3D Animation">3D Animation</option>
                <option value="Anime-Inspired">Anime-Inspired</option>
                <option value="Hand-Drawn Illustration">Hand-Drawn</option>
                <option value="Motion Graphics">Motion Graphics</option>
                <option value="Live Action">Live Action</option>
              </select>

              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 focus:outline-hidden"
              >
                <option value="ALL">All Formats</option>
                <option value="ANIMATION">Animation</option>
                <option value="VIDEO">Video</option>
                <option value="STATIC_IMAGE">Static</option>
                <option value="CAROUSEL">Carousel</option>
                <option value="ILLUSTRATED_GRAPHIC">Graphic</option>
              </select>
            </div>

            <div className="text-xs text-neutral-500">
              Showing <span className="font-semibold text-neutral-900">{filteredGallery.length}</span> creatives
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGallery.map((item) => (
              <div
                key={item.creative.id}
                className="bg-white rounded-lg border border-neutral-200/90 shadow-2xs hover:shadow-xs hover:border-neutral-300 transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>

                  <div className="relative bg-neutral-100 aspect-video overflow-hidden border-b border-neutral-100">
                    <img
                      src={item.creative.thumbnailUrl}
                      alt={item.creative.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                        style={{ backgroundColor: STYLE_COLORS[item.creative.visualStyle] || '#64748b' }}
                      >
                        {item.creative.visualStyle}
                      </span>
                    </div>
                    {item.creative.durationSeconds && (
                      <div className="absolute bottom-2 right-2 bg-neutral-900/80 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                        {item.creative.durationSeconds}s
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                      <span>{item.campaign?.clientName || 'Brand'}</span>
                      <span className="font-mono">{item.creative.aspectRatio}</span>
                    </div>

                    <h3 className="font-bold text-neutral-900 text-sm leading-snug">
                      {item.creative.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-1 italic">
                      "{item.creative.primaryMessage || 'No primary message logged'}"
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {item.creative.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded text-[10px]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-neutral-100 text-center">
                      <div>
                        <div className="text-[9px] uppercase text-neutral-400 font-semibold">Spend</div>
                        <div className="text-xs font-bold text-neutral-900 font-mono mt-0.5">
                          ₹{Math.round(item.metrics.spend).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-neutral-400 font-semibold">CTR</div>
                        <div className="text-xs font-bold text-neutral-900 font-mono mt-0.5">
                          {item.metrics.ctr ? `${item.metrics.ctr.toFixed(2)}%` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-neutral-400 font-semibold">Conv</div>
                        <div className="text-xs font-bold text-neutral-900 font-mono mt-0.5">
                          {item.metrics.conversions.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-neutral-400 font-semibold">CPA</div>
                        <div className="text-xs font-bold text-neutral-900 font-mono mt-0.5">
                          {item.metrics.costPerConversion
                            ? `₹${item.metrics.costPerConversion.toFixed(2)}`
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">{item.creative.characterUsage}</span>
                  <button
                    type="button"
                    onClick={() => setEditingCreative(item.creative)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Metadata</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-lg border border-neutral-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Creative Asset Leaderboard</h2>
              <p className="text-xs text-neutral-500">
                Ranked with impression volume and verified non-null metrics
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                exportToCsv(
                  'creative_leaderboard',
                  creativeMetricsList.map((i) => ({
                    ID: i.creative.id,
                    Name: i.creative.name,
                    Style: i.creative.visualStyle,
                    Character: i.creative.characterUsage,
                    Spend: Math.round(i.metrics.spend),
                    Impressions: i.metrics.impressions,
                    Clicks: i.metrics.clicks,
                    CTR: i.metrics.ctr,
                    Conversions: i.metrics.conversions,
                    CPA: i.metrics.costPerConversion,
                  }))
                )
              }
              className="text-xs font-medium px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 rounded-md"
            >
              Export Leaderboard
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-4">Rank & Creative</th>
                  <th className="py-2.5 px-3">Visual Style</th>
                  <th className="py-2.5 px-3">Character</th>
                  <th className="py-2.5 px-3 text-right">Spend</th>
                  <th className="py-2.5 px-3 text-right">Impressions</th>
                  <th className="py-2.5 px-3 text-right">Clicks</th>
                  <th className="py-2.5 px-3 text-right">CTR</th>
                  <th className="py-2.5 px-3 text-right">Conversions</th>
                  <th className="py-2.5 px-3 text-right">CPA</th>
                  <th className="py-2.5 px-3 text-right">Completion</th>
                  <th className="py-2.5 px-4 text-center">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {[...creativeMetricsList]
                  .sort((a, b) => (b.metrics.ctr || 0) - (a.metrics.ctr || 0))
                  .map((item, idx) => (
                    <tr key={item.creative.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-neutral-900 flex items-center gap-2.5">
                        <span className="font-mono font-bold text-neutral-400 w-4">#{idx + 1}</span>
                        <span className="truncate max-w-xs">{item.creative.name}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                          style={{ backgroundColor: STYLE_COLORS[item.creative.visualStyle] || '#64748b' }}
                        >
                          {item.creative.visualStyle}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600">{item.creative.characterUsage}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        ₹{Math.round(item.metrics.spend).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                        {item.metrics.impressions.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                        {item.metrics.clicks.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                        {item.metrics.ctr ? `${item.metrics.ctr.toFixed(2)}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-neutral-900">
                        {item.metrics.conversions.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                        {item.metrics.costPerConversion
                          ? `₹${item.metrics.costPerConversion.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                        {item.metrics.videoCompletionRate
                          ? `${item.metrics.videoCompletionRate.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setEditingCreative(item.creative)}
                          className="p-1 text-neutral-400 hover:text-blue-600 rounded"
                          title="Edit Metadata"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingCreative && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Edit Creative Metadata</h3>
                <p className="text-xs text-neutral-500">
                  Manual classification stored locally in browser storage
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCreative(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCreative(editingCreative.id, {
                  visualStyle: editingCreative.visualStyle,
                  animationStyle: editingCreative.animationStyle,
                  characterUsage: editingCreative.characterUsage,
                  durationSeconds: editingCreative.durationSeconds,
                  aspectRatio: editingCreative.aspectRatio,
                  creativeFormat: editingCreative.creativeFormat,
                  primaryMessage: editingCreative.primaryMessage,
                  callToAction: editingCreative.callToAction,
                });
                setEditingCreative(null);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Creative Name</label>
                <input
                  type="text"
                  disabled
                  value={editingCreative.name}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded bg-neutral-50 text-neutral-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Visual Style</label>
                  <select
                    value={editingCreative.visualStyle}
                    onChange={(e) =>
                      setEditingCreative({
                        ...editingCreative,
                        visualStyle: e.target.value as VisualStyle,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded bg-white text-neutral-900"
                  >
                    <option value="2D Cartoon">2D Cartoon</option>
                    <option value="3D Animation">3D Animation</option>
                    <option value="Anime-Inspired">Anime-Inspired</option>
                    <option value="Hand-Drawn Illustration">Hand-Drawn</option>
                    <option value="Motion Graphics">Motion Graphics</option>
                    <option value="Live Action">Live Action</option>
                    <option value="Mixed Media">Mixed Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Animation Style</label>
                  <select
                    value={editingCreative.animationStyle}
                    onChange={(e) =>
                      setEditingCreative({
                        ...editingCreative,
                        animationStyle: e.target.value as AnimationStyle,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded bg-white text-neutral-900"
                  >
                    <option value="Flat Animation">Flat Animation</option>
                    <option value="3D Character Animation">3D Character Animation</option>
                    <option value="Motion Graphics">Motion Graphics</option>
                    <option value="Whiteboard Animation">Whiteboard Animation</option>
                    <option value="Mixed Animation">Mixed Animation</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Character Usage</label>
                  <select
                    value={editingCreative.characterUsage}
                    onChange={(e) =>
                      setEditingCreative({
                        ...editingCreative,
                        characterUsage: e.target.value as CharacterUsage,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded bg-white text-neutral-900"
                  >
                    <option value="Cartoon Character">Cartoon Character</option>
                    <option value="Mascot">Mascot</option>
                    <option value="Animal Character">Animal Character</option>
                    <option value="Human Character">Human Character</option>
                    <option value="No Character">No Character</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Aspect Ratio</label>
                  <select
                    value={editingCreative.aspectRatio}
                    onChange={(e) =>
                      setEditingCreative({
                        ...editingCreative,
                        aspectRatio: e.target.value as AspectRatio,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded bg-white text-neutral-900"
                  >
                    <option value="9:16">9:16 (Vertical)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:5">4:5 (Portrait)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Duration (Seconds, null if static)
                  </label>
                  <input
                    type="number"
                    value={editingCreative.durationSeconds ?? ''}
                    onChange={(e) =>
                      setEditingCreative({
                        ...editingCreative,
                        durationSeconds: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded bg-white text-neutral-900"
                    placeholder="e.g. 15"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Creative Format</label>
                  <select
                    value={editingCreative.creativeFormat}
                    onChange={(e) =>
                      setEditingCreative({
                        ...editingCreative,
                        creativeFormat: e.target.value as CreativeFormat,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded bg-white text-neutral-900"
                  >
                    <option value="ANIMATION">Animation</option>
                    <option value="VIDEO">Video</option>
                    <option value="STATIC_IMAGE">Static Image</option>
                    <option value="CAROUSEL">Carousel</option>
                    <option value="ILLUSTRATED_GRAPHIC">Illustrated Graphic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Primary Message</label>
                <input
                  type="text"
                  value={editingCreative.primaryMessage}
                  onChange={(e) =>
                    setEditingCreative({ ...editingCreative, primaryMessage: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded bg-white text-neutral-900"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCreative(null)}
                  className="px-3 py-1.5 border border-neutral-200 rounded text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-medium flex items-center gap-1.5 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Metadata</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
