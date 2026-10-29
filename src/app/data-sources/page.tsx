'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { useData } from '@/lib/context/DataContext';
import ChartContainer from '@/components/charts/ChartContainer';
import EChartsWrapper, { PLATFORM_COLORS, SWISS_PALETTE } from '@/components/charts/EChartsWrapper';
import MetricCard from '@/components/common/MetricCard';
import { exportToCsv, exportToJson } from '@/lib/export/csvExport';
import { PerformanceObservationSchema, CampaignSchema, CreativeSchema } from '@/lib/validation/schemas';
import {
  Database,
  Upload,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  Server,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { PerformanceObservation } from '@/types';

export default function DataSourcesPage() {
  const {
    campaigns,
    creatives,
    observations,
    importDataset,
    resetToDemo,
    isDemoMode,
  } = useData();

  const [activeTab, setActiveTab] = useState<'quality' | 'import' | 'integrations'>('quality');

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    date: 'date',
    campaignId: 'campaignId',
    creativeId: 'creativeId',
    platform: 'platform',
    impressions: 'impressions',
    clicks: 'clicks',
    spend: 'spend',
    conversions: 'conversions',
  });
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [integrationsStatus, setIntegrationsStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/integrations/status')
      .then((res) => res.json())
      .then((data) => setIntegrationsStatus(data.integrations))
      .catch((e) => console.error('Failed to query integrations status:', e));
  }, []);

  const qualityReport = useMemo(() => {
    const totalRecords = observations.length;
    let missingReach = 0;
    let missingConversionVal = 0;
    let missingVideoViews = 0;
    let missingLikes = 0;
    let duplicateRecords = 0;
    let invalidDates = 0;

    const seenKeys = new Set<string>();

    for (const obs of observations) {
      if (obs.reach === null) missingReach++;
      if (obs.conversionValue === null) missingConversionVal++;
      if (obs.videoViews === null) missingVideoViews++;
      if (obs.likes === null) missingLikes++;

      const key = `${obs.date}_${obs.campaignId}_${obs.creativeId}`;
      if (seenKeys.has(key)) duplicateRecords++;
      else seenKeys.add(key);

      if (isNaN(new Date(obs.date).getTime())) invalidDates++;
    }

    const unclassifiedCreatives = creatives.filter(
      (c) => c.visualStyle === 'Unknown' || c.animationStyle === 'Unknown' || c.characterUsage === 'Unknown'
    ).length;

    return {
      totalRecords,
      validRecords: totalRecords - invalidDates - duplicateRecords,
      duplicateRecords,
      invalidDates,
      missingReach,
      missingConversionVal,
      missingVideoViews,
      missingLikes,
      unclassifiedCreatives,
      completenessRate: totalRecords > 0 ? Number((((totalRecords * 4 - missingReach - missingConversionVal - missingVideoViews - missingLikes) / (totalRecords * 4)) * 100).toFixed(1)) : 100,
    };
  }, [observations, creatives]);

  const completenessOption = useMemo(() => {
    const total = qualityReport.totalRecords || 1;
    const fields = [
      { name: 'Spend & Impressions', complete: 100 },
      { name: 'Clicks & Conversions', complete: 100 },
      { name: 'Reach Metric', complete: Number((((total - qualityReport.missingReach) / total) * 100).toFixed(1)) },
      { name: 'Conversion Value', complete: Number((((total - qualityReport.missingConversionVal) / total) * 100).toFixed(1)) },
      { name: 'Video Play Metrics', complete: Number((((total - qualityReport.missingVideoViews) / total) * 100).toFixed(1)) },
      { name: 'Social Interactions', complete: Number((((total - qualityReport.missingLikes) / total) * 100).toFixed(1)) },
    ];

    return {
      grid: { left: '4%', right: '8%', bottom: '10%', top: '6%', containLabel: true },
      tooltip: { trigger: 'axis', formatter: '{b}: {c}% complete' },
      xAxis: { type: 'value', max: 100, axisLabel: { color: '#737373', fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      yAxis: { type: 'category', data: fields.map((f) => f.name), axisLabel: { color: '#737373', fontSize: 10 } },
      series: [
        {
          type: 'bar',
          data: fields.map((f) => ({
            value: f.complete,
            itemStyle: { color: f.complete >= 90 ? '#10b981' : f.complete >= 60 ? '#3b82f6' : '#f59e0b', borderRadius: [0, 4, 4, 0] },
          })),
        },
      ],
    };
  }, [qualityReport]);

  const platformRecordsOption = useMemo(() => {
    const counts = new Map<string, number>();
    for (const obs of observations) {
      counts.set(obs.platform, (counts.get(obs.platform) || 0) + 1);
    }
    const data = Array.from(counts.entries()).map(([p, cnt]) => ({ name: p, value: cnt }));
    return {
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map((d) => d.name), axisLabel: { color: '#737373', fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { color: '#737373', fontSize: 10 }, splitLine: { lineStyle: { color: '#f4f4f5' } } },
      series: [
        {
          type: 'bar',
          data: data.map((d) => ({
            value: d.value,
            itemStyle: { color: PLATFORM_COLORS[d.name] || '#2563eb', borderRadius: [4, 4, 0, 0] },
          })),
        },
      ],
    };
  }, [observations]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportErrors([]);
    setImportSuccessCount(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
      complete: (results) => {
        if (results.meta.fields) {
          setCsvColumns(results.meta.fields);

          const newMap: Record<string, string> = { ...columnMapping };
          results.meta.fields.forEach((f) => {
            const lower = f.toLowerCase();
            if (lower.includes('date')) newMap.date = f;
            if (lower.includes('campaign')) newMap.campaignId = f;
            if (lower.includes('creative')) newMap.creativeId = f;
            if (lower.includes('plat')) newMap.platform = f;
            if (lower.includes('impr')) newMap.impressions = f;
            if (lower.includes('click')) newMap.clicks = f;
            if (lower.includes('spend') || lower.includes('cost')) newMap.spend = f;
            if (lower.includes('conv')) newMap.conversions = f;
          });
          setColumnMapping(newMap);
        }
        setCsvPreviewRows(results.data as any[]);
      },
      error: (err) => {
        setImportErrors([`CSV Parse Error: ${err.message}`]);
      },
    });
  };

  const handleExecuteImport = () => {
    if (!csvFile) return;

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        const validObs: PerformanceObservation[] = [];
        const errors: string[] = [];

        rows.forEach((row, idx) => {
          try {
            const dateVal = row[columnMapping.date]?.trim() || '';
            const campId = row[columnMapping.campaignId]?.trim() || 'imported-camp';
            const crId = row[columnMapping.creativeId]?.trim() || 'imported-cr';
            const platform = (row[columnMapping.platform]?.trim() || 'Meta') as any;
            const impressions = Number(row[columnMapping.impressions]) || 0;
            const clicks = Number(row[columnMapping.clicks]) || 0;
            const spend = Number(row[columnMapping.spend]) || 0;
            const conversions = Number(row[columnMapping.conversions]) || 0;

            const record: PerformanceObservation = {
              id: `imp-${idx + 1}`,
              date: dateVal,
              campaignId: campId,
              creativeId: crId,
              platform: ['Meta', 'Google Ads', 'TikTok', 'YouTube', 'LinkedIn', 'Pinterest'].includes(platform)
                ? platform
                : 'Meta',
              impressions: Math.max(0, impressions),
              reach: null,
              clicks: Math.max(0, clicks),
              spend: Math.max(0, spend),
              conversions: Math.max(0, conversions),
              conversionValue: null,
              videoViews: null,
              completedVideoViews: null,
              likes: null,
              comments: null,
              shares: null,
              currency: 'INR',
              attributionWindow: '7d_click_1d_view',
              source: 'IMPORT',
            };

            const parsed = PerformanceObservationSchema.safeParse(record);
            if (parsed.success) {
              validObs.push(parsed.data);
            } else {
              errors.push(`Row ${idx + 1}: ${parsed.error.issues.map((i) => i.message).join(', ')}`);
            }
          } catch (err: any) {
            errors.push(`Row ${idx + 1}: unexpected error ${err.message}`);
          }
        });

        if (validObs.length > 0) {
          importDataset({ observations: validObs });
          setImportSuccessCount(validObs.length);
        }
        setImportErrors(errors.slice(0, 10));
      },
    });
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            Data Sources & Ingestion Center
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Data quality audits, CSV schema mapping preview, JSON synchronization, and API integration architecture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportToJson('bekemon_full_dataset', { campaigns, creatives, observations })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-md hover:bg-neutral-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      <div className="flex items-center bg-neutral-100 p-1 rounded-lg text-xs font-medium w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('quality')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'quality' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-600'
          }`}
        >
          Data Quality Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'import' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-600'
          }`}
        >
          CSV / JSON Import Center
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'integrations' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-600'
          }`}
        >
          Ad Network Integrations
        </button>
      </div>

      {activeTab === 'quality' && (
        <div className="space-y-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <MetricCard
              label="Total Records"
              value={qualityReport.totalRecords}
              format="number"
              subtext="Observations in memory"
            />
            <MetricCard
              label="Completeness Score"
              value={qualityReport.completenessRate}
              format="percent"
              subtext="Non-missing metric fields"
            />
            <MetricCard
              label="Duplicate Records"
              value={qualityReport.duplicateRecords}
              format="number"
              isInverse={true}
              subtext="Identical date/campaign/creative"
            />
            <MetricCard
              label="Unclassified Creatives"
              value={qualityReport.unclassifiedCreatives}
              format="number"
              isInverse={true}
              subtext="Missing style or character tag"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="Metric Completeness by Dimension"
              subtitle="Percentage of records containing verified non-null metric values"
              infoTooltip="Notice that missing metrics are never replaced with 0; null signifies unavailable."
            >
              <EChartsWrapper option={completenessOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>

            <ChartContainer
              title="Observation Density by Advertising Platform"
              subtitle="Volume of daily records contributed by each connected network"
            >
              <EChartsWrapper option={platformRecordsOption} style={{ height: '280px', width: '100%' }} />
            </ChartContainer>
          </div>

          <div className="bg-neutral-50 rounded-lg border border-neutral-200/90 p-4 text-xs text-neutral-600 leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-neutral-900">Data Reliability Assurance:</span> In accordance
              with BEKEMON principles, data is not assumed to be reliable merely because an import succeeded.
              Null values in reach or conversion value are transparently presented as unavailable, protecting your
              agency from distorted weighted averages or artificial conversion rate spikes.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-white rounded-lg border border-neutral-200/90 p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900">CSV Ingestion & Column Mapping</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Follow the guided workflow: Upload file → Map column headers → Validate schema → Commit dataset.
            </p>
          </div>

          <div className="border-2 border-dashed border-neutral-200 hover:border-neutral-400 rounded-xl p-8 text-center transition-colors">
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-neutral-800">
              {csvFile ? csvFile.name : 'Choose a CSV file or drag and drop here'}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Supports raw exports from Meta Ads Manager, Google Ads, TikTok Ads, or internal campaign logs.
            </p>
            <label className="mt-4 inline-block px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold cursor-pointer shadow-2xs">
              <span>Select CSV File</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {csvColumns.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Map Uploaded Columns to Internal Schema
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Match your CSV column names to BEKEMON required observation metrics.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {Object.keys(columnMapping).map((targetField) => (
                  <div key={targetField} className="bg-neutral-50 p-2.5 rounded border border-neutral-200">
                    <label className="font-semibold text-neutral-700 block mb-1 capitalize">
                      {targetField} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={columnMapping[targetField] || ''}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [targetField]: e.target.value })
                      }
                      className="w-full bg-white border border-neutral-200 rounded px-2 py-1 text-neutral-800 text-xs"
                    >
                      <option value="">-- Choose Column --</option>
                      {csvColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <div className="text-xs font-semibold text-neutral-700 mb-1.5">Data Preview (First 5 Rows)</div>
                <div className="overflow-x-auto border border-neutral-200 rounded">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-neutral-100 text-neutral-600">
                      <tr>
                        {csvColumns.map((col) => (
                          <th key={col} className="p-2 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {csvPreviewRows.map((row, i) => (
                        <tr key={i} className="hover:bg-neutral-50">
                          {csvColumns.map((col) => (
                            <td key={col} className="p-2 whitespace-nowrap text-neutral-700">
                              {row[col] ?? '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  Validate & Commit Import
                </button>
              </div>

              {importSuccessCount !== null && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Successfully validated and ingested {importSuccessCount} records into active workspace.</span>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Rejected Records During Ingestion:</span>
                  </div>
                  {importErrors.map((err, i) => (
                    <div key={i} className="font-mono text-[11px] pl-5">
                      • {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-neutral-200/90 p-6 shadow-2xs">
            <h2 className="text-base font-bold text-neutral-900 mb-1">
              Advertising API Integration Architecture
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Modular adapter pipeline for direct network ingestion. Live connections require server-side credentials.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="border border-neutral-200 rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-neutral-900">Meta Ads API</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        integrationsStatus?.meta?.connected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {integrationsStatus?.meta?.connected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Fetches Facebook and Instagram campaign insights, creative asset cards, and ad video completion.
                  </p>
                  <div className="mt-3 p-2 bg-neutral-50 rounded text-[10px] font-mono text-neutral-600">
                    Env: META_ACCESS_TOKEN
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100 text-[11px] text-neutral-400">
                  Documentation:{' '}
                  <a
                    href="https://developers.facebook.com/docs/marketing-api/insights/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Marketing API Insights
                  </a>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-neutral-900">Google Ads API</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        integrationsStatus?.google?.connected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {integrationsStatus?.google?.connected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Connects Search, Display, and YouTube video ad reporting via Google Ads API v16.
                  </p>
                  <div className="mt-3 p-2 bg-neutral-50 rounded text-[10px] font-mono text-neutral-600">
                    Env: GOOGLE_ADS_DEVELOPER_TOKEN
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100 text-[11px] text-neutral-400">
                  Documentation:{' '}
                  <a
                    href="https://developers.google.com/google-ads/api/docs/reporting/overview"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Reporting API
                  </a>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-neutral-900">TikTok Marketing API</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        integrationsStatus?.tiktok?.connected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {integrationsStatus?.tiktok?.connected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Pulls vertical short-form video metrics, sound engagement, and TikTok Spark ad performance.
                  </p>
                  <div className="mt-3 p-2 bg-neutral-50 rounded text-[10px] font-mono text-neutral-600">
                    Env: TIKTOK_ACCESS_TOKEN
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100 text-[11px] text-neutral-400">
                  Documentation:{' '}
                  <a
                    href="https://business-api.tiktok.com/portal/docs/marketing-api/v2.0"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    TikTok Business API
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Reset to Deterministic Demo Dataset?</h3>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              This will erase any custom CSV/JSON imported datasets and reset the workspace to the official 20 campaigns, 50 creatives, and 90 days of simulated performance.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-3 py-1.5 border border-neutral-200 rounded text-xs text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDemo();
                  setIsResetModalOpen(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-2xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
