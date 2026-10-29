'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

export interface EChartsWrapperProps {
  option: any;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
  onChartReady?: (instance: echarts.ECharts) => void;
  onEvents?: Record<string, (params: any) => void>;
}

export const SWISS_PALETTE = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b',
];

export const PLATFORM_COLORS: Record<string, string> = {
  Meta: '#0668E1',
  'Google Ads': '#4285F4',
  YouTube: '#FF0000',
  JioCinema: '#6B21A8',
  ShareChat: '#0284C7',
  LinkedIn: '#0A66C2',
};

export const STYLE_COLORS: Record<string, string> = {
  '2D Cartoon': '#3b82f6',
  '3D Animation': '#8b5cf6',
  'Anime-Inspired': '#ec4899',
  'Hand-Drawn Illustration': '#10b981',
  'Motion Graphics': '#06b6d4',
  'Live Action': '#64748b',
  'Mixed Media': '#f59e0b',
  Other: '#94a3b8',
  Unknown: '#cbd5e1',
};

export default function EChartsWrapper({
  option,
  style = { height: '340px', width: '100%' },
  className = '',
  loading = false,
  onChartReady,
  onEvents,
}: EChartsWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      });
      if (onChartReady) {
        onChartReady(chartInstanceRef.current);
      }
    }

    const chartInstance = chartInstanceRef.current;

    const baseOption: echarts.EChartsOption = {
      color: SWISS_PALETTE,
      textStyle: {
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#52525b',
      },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        textStyle: {
          color: '#f4f4f5',
          fontSize: 12,
        },
        padding: [8, 12],
        extraCssText: 'border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);',
      },
    };

    chartInstance.setOption({ ...baseOption, ...option }, true);

    if (onEvents) {
      Object.entries(onEvents).forEach(([eventName, handler]) => {
        chartInstance.off(eventName);
        chartInstance.on(eventName, handler);
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [option, onEvents, onChartReady]);

  useEffect(() => {
    if (!chartInstanceRef.current) return;
    if (loading) {
      chartInstanceRef.current.showLoading({
        text: 'Aggregating metrics...',
        color: '#2563eb',
        textColor: '#71717a',
        maskColor: 'rgba(255, 255, 255, 0.8)',
      });
    } else {
      chartInstanceRef.current.hideLoading();
    }
  }, [loading]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={chartRef} style={style} className={className} />;
}
