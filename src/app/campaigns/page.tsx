'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import { aggregateObservations } from '@/lib/analytics/metrics';
import { PLATFORM_COLORS } from '@/components/charts/EChartsWrapper';
import {
  Search,
  LayoutGrid,
  List,
  ExternalLink,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react';
import { exportToCsv } from '@/lib/export/csvExport';

export default function CampaignExplorerPage() {
  const { campaigns, filteredObservations } = useData();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');

  const campaignSummaries = useMemo(() => {
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
        impressions: agg.impressions,
        clicks: agg.clicks,
        conversions: agg.conversions,
        ctr: agg.ctr,
        cpc: agg.cpc,
        costPerConversion: agg.costPerConversion,
        utilization,
        observationCount: list.length,
      };
    });
  }, [campaigns, filteredObservations]);

  const filteredCampaigns = useMemo(() => {
    return campaignSummaries.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (platformFilter !== 'ALL' && c.platform !== platformFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [campaignSummaries, statusFilter, platformFilter, search]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">Campaign Explorer</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Directory of active, paused, and completed campaigns with drill-down analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-md text-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'card' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              exportToCsv(
                'campaigns_directory',
                filteredCampaigns.map((c) => ({
                  ID: c.id,
                  Name: c.name,
                  Client: c.clientName,
                  Platform: c.platform,
                  Objective: c.objective,
                  Status: c.status,
                  Budget: c.budget,
                  Spend: Math.round(c.spend),
                  Conversions: c.conversions,
                  CTR: c.ctr ? `${c.ctr.toFixed(2)}%` : 'N/A',
                  CPA: c.costPerConversion ? `₹${c.costPerConversion.toFixed(2)}` : 'N/A',
                }))
              )
            }
            className="text-xs font-medium px-3 py-1.5 border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
          >
            Export Directory
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200/90 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campaigns by name, client, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-md bg-neutral-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-md px-2.5 py-1.5 text-neutral-700 focus:outline-hidden"
          >
            <option value="ALL">All Platforms</option>
            <option value="Meta">Meta</option>
            <option value="Google Ads">Google Ads</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Pinterest">Pinterest</option>
          </select>
        </div>

        <div className="text-xs text-neutral-500">
          Showing <span className="font-semibold text-neutral-900">{filteredCampaigns.length}</span> of{' '}
          {campaigns.length} campaigns
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white rounded-lg border border-neutral-200/90 p-5 shadow-2xs hover:shadow-xs hover:border-neutral-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                    style={{ backgroundColor: PLATFORM_COLORS[camp.platform] || '#64748b' }}
                  >
                    {camp.platform}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      camp.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : camp.status === 'PAUSED'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>

                <Link
                  href={`/campaigns/${camp.id}`}
                  className="font-bold text-neutral-900 hover:text-blue-600 text-sm block leading-snug tracking-tight"
                >
                  {camp.name}
                </Link>
                <div className="text-xs text-neutral-500 mt-0.5 font-medium">{camp.clientName}</div>
                <p className="text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
                  {camp.description}
                </p>

                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-500">Budget Spent</span>
                    <span className="font-mono font-semibold text-neutral-900">
                      ₹{Math.round(camp.spend).toLocaleString('en-IN')} / ₹{camp.budget.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        camp.utilization > 100
                          ? 'bg-rose-500'
                          : camp.utilization > 85
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, camp.utilization)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-100 text-center">
                  <div>
                    <div className="text-[10px] uppercase text-neutral-400 font-semibold">Conversions</div>
                    <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5">
                      {camp.conversions.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-neutral-400 font-semibold">CTR</div>
                    <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5">
                      {camp.ctr ? `${camp.ctr.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-neutral-400 font-semibold">Cost / Conv</div>
                    <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5">
                      {camp.costPerConversion ? `₹${camp.costPerConversion.toFixed(2)}` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">{camp.objective.replace('_', ' ')}</span>
                <Link
                  href={`/campaigns/${camp.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
                >
                  <span>Detailed Analytics</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (

        <div className="bg-white rounded-lg border border-neutral-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-4">Campaign</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Budget</th>
                  <th className="py-2.5 px-3 text-right">Actual Spend</th>
                  <th className="py-2.5 px-3 text-right">Utilization</th>
                  <th className="py-2.5 px-3 text-right">Conversions</th>
                  <th className="py-2.5 px-3 text-right">CTR</th>
                  <th className="py-2.5 px-3 text-right">CPA</th>
                  <th className="py-2.5 px-4 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-neutral-900">
                      <Link href={`/campaigns/${camp.id}`} className="hover:text-blue-600 font-semibold">
                        {camp.name}
                      </Link>
                      <div className="text-[10px] text-neutral-400 font-normal">{camp.clientName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                        style={{ backgroundColor: PLATFORM_COLORS[camp.platform] || '#64748b' }}
                      >
                        {camp.platform}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : camp.status === 'PAUSED'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-600">
                      ₹{camp.budget.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-neutral-900">
                      ₹{Math.round(camp.spend).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span
                        className={
                          camp.utilization > 100
                            ? 'text-rose-600'
                            : camp.utilization > 85
                            ? 'text-amber-600'
                            : 'text-neutral-700'
                        }
                      >
                        {camp.utilization.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {camp.conversions.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {camp.ctr ? `${camp.ctr.toFixed(2)}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {camp.costPerConversion ? `₹${camp.costPerConversion.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/campaigns/${camp.id}`}
                        className="text-neutral-400 hover:text-blue-600 inline-flex items-center justify-center p-1 rounded"
                        title="View Detailed Analytics"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
