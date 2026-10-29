'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import {
  Calendar,
  Filter,
  X,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Layers,
  Palette,
  Users,
} from 'lucide-react';
import { Platform, VisualStyle, CharacterUsage, CampaignObjective } from '@/types';

export default function GlobalFilterBar() {
  const {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    activeFilterCount,
    campaigns,
    isDemoMode,
  } = useData();

  const [isOpenDetails, setIsOpenDetails] = useState(false);

  const clientOptions = Array.from(new Set(campaigns.map((c) => c.clientName)));
  const platformOptions: Platform[] = ['Meta', 'Google Ads', 'YouTube', 'JioCinema', 'ShareChat', 'LinkedIn'];
  const visualStyleOptions: VisualStyle[] = [
    '2D Cartoon',
    '3D Animation',
    'Anime-Inspired',
    'Hand-Drawn Illustration',
    'Motion Graphics',
    'Live Action',
    'Mixed Media',
  ];
  const characterOptions: CharacterUsage[] = [
    'Cartoon Character',
    'Mascot',
    'Animal Character',
    'Human Character',
    'No Character',
  ];
  const objectiveOptions: CampaignObjective[] = [
    'CONVERSIONS',
    'TRAFFIC',
    'BRAND_AWARENESS',
    'LEAD_GENERATION',
    'VIDEO_VIEWS',
    'ENGAGEMENT',
  ];

  const handlePresetChange = (preset: '7d' | '14d' | '30d' | '90d' | 'all') => {
    let start = '2024-01-01';
    const end = '2024-03-30';

    if (preset === '7d') start = '2024-03-23';
    else if (preset === '14d') start = '2024-03-16';
    else if (preset === '30d') start = '2024-03-01';
    else if (preset === '90d') start = '2024-01-01';
    else if (preset === 'all') start = '2024-01-01';

    setFilters((prev) => ({
      ...prev,
      preset,
      dateRange: { start, end },
    }));
  };

  const toggleArrayFilter = <T extends string>(
    key: 'clients' | 'platforms' | 'visualStyles' | 'characterUsages' | 'objectives',
    value: T
  ) => {
    setFilters((prev) => {
      const currentList = prev[key] as T[];
      const exists = currentList.includes(value);
      const updated = exists ? currentList.filter((item) => item !== value) : [...currentList, value];
      return { ...prev, [key]: updated };
    });
  };

  return (
    <div className="bg-white border-b border-neutral-200 px-4 md:px-8 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-md text-xs font-medium text-neutral-600">
          <Calendar className="w-3.5 h-3.5 ml-1 text-neutral-400" />
          <button
            type="button"
            onClick={() => handlePresetChange('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filters.preset === 'all'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'hover:text-neutral-900'
            }`}
          >
            All (90d)
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('30d')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filters.preset === '30d'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'hover:text-neutral-900'
            }`}
          >
            Last 30d
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('14d')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filters.preset === '14d'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'hover:text-neutral-900'
            }`}
          >
            14d
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('7d')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filters.preset === '7d'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'hover:text-neutral-900'
            }`}
          >
            7d
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-1.5">
          <span className="text-xs text-neutral-400 font-medium mr-1">Platform:</span>
          {platformOptions.map((plat) => {
            const isSelected = filters.platforms.includes(plat);
            return (
              <button
                key={plat}
                type="button"
                onClick={() => toggleArrayFilter('platforms', plat)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 font-medium shadow-2xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {plat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpenDetails(!isOpenDetails)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
              isOpenDetails || activeFilterCount > 0
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 bg-blue-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpenDetails ? 'rotate-180' : ''}`} />
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              title="Reset all filters"
              className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isOpenDetails && (
        <div className="mt-3 pt-3 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-100 text-xs">

          <div>
            <div className="font-semibold text-neutral-800 mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-neutral-400" />
              <span>Creative Style</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
              {visualStyleOptions.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => toggleArrayFilter('visualStyles', st)}
                  className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                    filters.visualStyles.includes(st)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-semibold text-neutral-800 mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span>Character / Mascot</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
              {characterOptions.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => toggleArrayFilter('characterUsages', char)}
                  className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                    filters.characterUsages.includes(char)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-semibold text-neutral-800 mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>Client</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
              {clientOptions.map((cl) => (
                <button
                  key={cl}
                  type="button"
                  onClick={() => toggleArrayFilter('clients', cl)}
                  className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                    filters.clients.includes(cl)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {cl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-semibold text-neutral-800 mb-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <span>Campaign Objective</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
              {objectiveOptions.map((obj) => (
                <button
                  key={obj}
                  type="button"
                  onClick={() => toggleArrayFilter('objectives', obj)}
                  className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                    filters.objectives.includes(obj)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {obj.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
