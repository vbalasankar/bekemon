'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number | null;
  deltaPct?: number | null;
  deltaLabel?: string;
  isInverse?: boolean;
  format?: 'currency' | 'percent' | 'number' | 'ratio';
  currencySymbol?: string;
  subtext?: string;
  className?: string;
}

export function formatMetricValue(
  value: number | null,
  format?: 'currency' | 'percent' | 'number' | 'ratio',
  currencySymbol = '₹'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  switch (format) {
    case 'currency':
      return `${currencySymbol}${value.toLocaleString('en-IN', {
        minimumFractionDigits: value >= 100 ? 0 : 2,
        maximumFractionDigits: 2,
      })}`;
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'ratio':
      return `${value.toFixed(2)}x`;
    case 'number':
    default:
      return value >= 1000 ? value.toLocaleString('en-IN') : value.toString();
  }
}

export default function MetricCard({
  label,
  value,
  deltaPct,
  deltaLabel = 'vs previous period',
  isInverse = false,
  format = 'number',
  currencySymbol = '₹',
  subtext,
  className = '',
}: MetricCardProps) {
  const displayVal = typeof value === 'number' ? formatMetricValue(value, format, currencySymbol) : value ?? '—';

  let deltaColor = 'text-neutral-500';
  let deltaBg = 'bg-neutral-100';
  let DeltaIcon = Minus;

  if (deltaPct !== null && deltaPct !== undefined && !isNaN(deltaPct)) {
    const isPositive = deltaPct > 0;
    const isGood = isInverse ? !isPositive : isPositive;

    if (Math.abs(deltaPct) < 0.1) {
      DeltaIcon = Minus;
      deltaColor = 'text-neutral-500';
      deltaBg = 'bg-neutral-100';
    } else if (isGood) {
      DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;
      deltaColor = 'text-emerald-700';
      deltaBg = 'bg-emerald-50';
    } else {
      DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;
      deltaColor = 'text-rose-700';
      deltaBg = 'bg-rose-50';
    }
  }

  return (
    <div
      className={`bg-white rounded-lg border border-neutral-200/80 p-4 shadow-2xs hover:border-neutral-300 transition-all ${className}`}
    >
      <div className="flex items-center justify-between text-neutral-500 mb-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-neutral-900 font-sans">{displayVal}</div>

        {deltaPct !== null && deltaPct !== undefined && !isNaN(deltaPct) && (
          <div
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold ${deltaBg} ${deltaColor}`}
            title={`${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}% ${deltaLabel}`}
          >
            <DeltaIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>
              {deltaPct > 0 ? '+' : ''}
              {deltaPct.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {subtext && <div className="text-[11px] text-neutral-400 mt-1.5 truncate">{subtext}</div>}
    </div>
  );
}
