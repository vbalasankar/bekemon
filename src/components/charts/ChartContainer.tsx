'use client';

import React, { useState } from 'react';
import { Maximize2, Minimize2, Download, Info, FileSpreadsheet } from 'lucide-react';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  infoTooltip?: string;
  metricSelector?: {
    value: string;
    options: { label: string; value: string }[];
    onChange: (val: string) => void;
  };
  secondaryControl?: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  onExportCsv?: () => void;
  onDownloadImage?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function ChartContainer({
  title,
  subtitle,
  infoTooltip,
  metricSelector,
  secondaryControl,
  isEmpty = false,
  emptyMessage = 'No performance data matches the selected filters.',
  onExportCsv,
  onDownloadImage,
  children,
  className = '',
}: ChartContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <div
        className={`bg-white rounded-lg border border-neutral-200/90 shadow-xs flex flex-col overflow-hidden transition-all duration-150 ${className}`}
      >

        <div className="px-5 py-3.5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-neutral-900 tracking-tight truncate">{title}</h3>
                {infoTooltip && (
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      onClick={() => setShowTooltip(!showTooltip)}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors p-0.5 rounded cursor-pointer"
                      title="Analytical context"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {showTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-64 p-2.5 bg-neutral-900 text-neutral-100 text-xs rounded shadow-lg pointer-events-none leading-relaxed">
                        {infoTooltip}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {secondaryControl}

            {metricSelector && (
              <select
                value={metricSelector.value}
                onChange={(e) => metricSelector.onChange(e.target.value)}
                className="text-xs font-medium bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1 text-neutral-700 hover:border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {metricSelector.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                title="Export Chart Data (CSV)"
                className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            )}

            {onDownloadImage && (
              <button
                type="button"
                onClick={onDownloadImage}
                title="Download Chart Image (PNG)"
                className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              title="Expand Chart"
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col justify-center min-h-[280px]">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-2 text-neutral-400 font-mono text-xs">
                ∅
              </div>
              <p className="text-sm font-medium text-neutral-600">{emptyMessage}</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                Try widening your date range or adjusting global filters.
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
                {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                title="Close fullscreen view"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto min-h-[500px] flex flex-col justify-center">
              {isEmpty ? (
                <div className="text-center py-20 text-neutral-400">{emptyMessage}</div>
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
