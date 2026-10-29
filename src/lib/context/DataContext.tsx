'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Campaign,
  Creative,
  PerformanceObservation,
  AudienceObservation,
  GlobalFilters,
  CalculatedMetrics,
  SavedView,
} from '@/types';
import { generateDeterministicDemoData } from '@/lib/data/demoData';
import { aggregateObservations } from '@/lib/analytics/metrics';

interface DataContextType {
  campaigns: Campaign[];
  creatives: Creative[];
  observations: PerformanceObservation[];
  audienceObservations: AudienceObservation[];
  filteredObservations: PerformanceObservation[];
  filteredCampaigns: Campaign[];
  filteredCreatives: Creative[];
  metrics: CalculatedMetrics;
  previousMetrics: CalculatedMetrics | null;
  filters: GlobalFilters;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>;
  updateFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  resetFilters: () => void;
  isDemoMode: boolean;
  resetToDemo: () => void;
  importDataset: (data: {
    campaigns?: Campaign[];
    creatives?: Creative[];
    observations: PerformanceObservation[];
  }) => void;
  updateCreative: (creativeId: string, updates: Partial<Creative>) => void;
  savedViews: SavedView[];
  saveView: (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteView: (id: string) => void;
  isAudienceDataAvailable: boolean;
  toggleAudienceData: (enabled: boolean) => void;
  activeFilterCount: number;
}

const defaultFilters: GlobalFilters = {
  dateRange: {
    start: '2024-01-01',
    end: '2024-03-30',
  },
  preset: 'all',
  clients: [],
  platforms: [],
  campaigns: [],
  objectives: [],
  statuses: [],
  creativeFormats: [],
  visualStyles: [],
  animationStyles: [],
  characterUsages: [],
  aspectRatios: [],
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_DATA = 'bekemon_dataset_v1';
const LOCAL_STORAGE_KEY_CREATIVE_EDITS = 'bekemon_creative_edits_v1';
const LOCAL_STORAGE_KEY_SAVED_VIEWS = 'bekemon_saved_views_v1';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [observations, setObservations] = useState<PerformanceObservation[]>([]);
  const [audienceObservations, setAudienceObservations] = useState<AudienceObservation[]>([]);
  const [isAudienceDataAvailable, setIsAudienceDataAvailable] = useState<boolean>(true);
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
      const savedEdits = localStorage.getItem(LOCAL_STORAGE_KEY_CREATIVE_EDITS);
      const savedViewsData = localStorage.getItem(LOCAL_STORAGE_KEY_SAVED_VIEWS);

      let initialCampaigns: Campaign[] = [];
      let initialCreatives: Creative[] = [];
      let initialObservations: PerformanceObservation[] = [];
      let initialAudience: AudienceObservation[] = [];

      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        initialCampaigns = parsed.campaigns || [];
        initialCreatives = parsed.creatives || [];
        initialObservations = parsed.observations || [];
        initialAudience = parsed.audienceObservations || [];
        setIsDemoMode(false);
      } else {
        const demo = generateDeterministicDemoData();
        initialCampaigns = demo.campaigns;
        initialCreatives = demo.creatives;
        initialObservations = demo.observations;
        initialAudience = demo.audienceObservations;
        setIsDemoMode(true);
      }

      if (savedEdits) {
        const editsMap: Record<string, Partial<Creative>> = JSON.parse(savedEdits);
        initialCreatives = initialCreatives.map((cr) => {
          if (editsMap[cr.id]) {
            return { ...cr, ...editsMap[cr.id] };
          }
          return cr;
        });
      }

      setCampaigns(initialCampaigns);
      setCreatives(initialCreatives);
      setObservations(initialObservations);
      setAudienceObservations(initialAudience);

      if (savedViewsData) {
        setSavedViews(JSON.parse(savedViewsData));
      } else {

        setSavedViews([
          {
            id: 'preset-1',
            name: 'Cartoon vs Live Action Efficiency',
            createdAt: '2024-03-01T00:00:00Z',
            updatedAt: '2024-03-01T00:00:00Z',
            dataset: 'styles',
            chartType: 'scatter',
            xAxis: 'spend',
            yAxis: 'ctr',
            groupBy: 'visualStyle',
            metric: 'ctr',
            description: 'Spend vs CTR comparison grouped by Visual Style',
          },
          {
            id: 'preset-2',
            name: 'Daily Spend Trends Across Platforms',
            createdAt: '2024-03-01T00:00:00Z',
            updatedAt: '2024-03-01T00:00:00Z',
            dataset: 'daily',
            chartType: 'line',
            xAxis: 'date',
            yAxis: 'spend',
            groupBy: 'platform',
            metric: 'spend',
            description: 'Daily media spend by advertising platform',
          },
        ]);
      }
    } catch (e) {
      console.error('Failed to load local storage state:', e);
      const demo = generateDeterministicDemoData();
      setCampaigns(demo.campaigns);
      setCreatives(demo.creatives);
      setObservations(demo.observations);
      setAudienceObservations(demo.audienceObservations);
      setIsDemoMode(true);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const updateFilter = <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.preset !== 'all') count++;
    if (filters.clients.length > 0) count += filters.clients.length;
    if (filters.platforms.length > 0) count += filters.platforms.length;
    if (filters.campaigns.length > 0) count += filters.campaigns.length;
    if (filters.objectives.length > 0) count += filters.objectives.length;
    if (filters.statuses.length > 0) count += filters.statuses.length;
    if (filters.creativeFormats.length > 0) count += filters.creativeFormats.length;
    if (filters.visualStyles.length > 0) count += filters.visualStyles.length;
    if (filters.animationStyles.length > 0) count += filters.animationStyles.length;
    if (filters.characterUsages.length > 0) count += filters.characterUsages.length;
    if (filters.aspectRatios.length > 0) count += filters.aspectRatios.length;
    return count;
  }, [filters]);

  const campaignMap = useMemo(() => {
    const map = new Map<string, Campaign>();
    for (const c of campaigns) {
      map.set(c.id, c);
    }
    return map;
  }, [campaigns]);

  const creativeMap = useMemo(() => {
    const map = new Map<string, Creative>();
    for (const cr of creatives) {
      map.set(cr.id, cr);
    }
    return map;
  }, [creatives]);

  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {

      if (filters.dateRange.start && obs.date < filters.dateRange.start) return false;
      if (filters.dateRange.end && obs.date > filters.dateRange.end) return false;

      if (filters.platforms.length > 0 && !filters.platforms.includes(obs.platform)) return false;

      if (filters.campaigns.length > 0 && !filters.campaigns.includes(obs.campaignId)) return false;

      const camp = campaignMap.get(obs.campaignId);
      if (camp) {
        if (filters.clients.length > 0 && !filters.clients.includes(camp.clientName)) return false;
        if (filters.objectives.length > 0 && !filters.objectives.includes(camp.objective)) return false;
        if (filters.statuses.length > 0 && !filters.statuses.includes(camp.status)) return false;
      }

      const cr = creativeMap.get(obs.creativeId);
      if (cr) {
        if (filters.creativeFormats.length > 0 && !filters.creativeFormats.includes(cr.creativeFormat)) return false;
        if (filters.visualStyles.length > 0 && !filters.visualStyles.includes(cr.visualStyle)) return false;
        if (filters.animationStyles.length > 0 && !filters.animationStyles.includes(cr.animationStyle)) return false;
        if (filters.characterUsages.length > 0 && !filters.characterUsages.includes(cr.characterUsage)) return false;
        if (filters.aspectRatios.length > 0 && !filters.aspectRatios.includes(cr.aspectRatio)) return false;
      }

      return true;
    });
  }, [observations, filters, campaignMap, creativeMap]);

  const filteredCampaigns = useMemo(() => {
    const activeCampIds = new Set(filteredObservations.map((o) => o.campaignId));
    return campaigns.filter((c) => activeCampIds.has(c.id));
  }, [campaigns, filteredObservations]);

  const filteredCreatives = useMemo(() => {
    const activeCrIds = new Set(filteredObservations.map((o) => o.creativeId));
    return creatives.filter((cr) => activeCrIds.has(cr.id));
  }, [creatives, filteredObservations]);

  const metrics = useMemo(() => {
    return aggregateObservations(filteredObservations);
  }, [filteredObservations]);

  const previousMetrics = useMemo(() => {
    if (!filters.dateRange.start || !filters.dateRange.end) return null;
    const start = new Date(filters.dateRange.start);
    const end = new Date(filters.dateRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays + 1);

    const prevStartStr = prevStart.toISOString().split('T')[0];
    const prevEndStr = prevEnd.toISOString().split('T')[0];

    const prevObs = observations.filter((obs) => {
      if (obs.date < prevStartStr || obs.date > prevEndStr) return false;
      if (filters.platforms.length > 0 && !filters.platforms.includes(obs.platform)) return false;
      if (filters.campaigns.length > 0 && !filters.campaigns.includes(obs.campaignId)) return false;
      return true;
    });

    if (prevObs.length === 0) return null;
    return aggregateObservations(prevObs);
  }, [observations, filters]);

  const resetToDemo = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_DATA);
      localStorage.removeItem(LOCAL_STORAGE_KEY_CREATIVE_EDITS);
      const demo = generateDeterministicDemoData();
      setCampaigns(demo.campaigns);
      setCreatives(demo.creatives);
      setObservations(demo.observations);
      setAudienceObservations(demo.audienceObservations);
      setIsDemoMode(true);
      resetFilters();
    } catch (e) {
      console.error('Failed to reset demo:', e);
    }
  };

  const importDataset = (data: {
    campaigns?: Campaign[];
    creatives?: Creative[];
    observations: PerformanceObservation[];
  }) => {
    try {

      let importedCampaigns = data.campaigns || [];
      if (importedCampaigns.length === 0) {
        const uniqueCampIds = Array.from(new Set(data.observations.map((o) => o.campaignId)));
        importedCampaigns = uniqueCampIds.map((id) => ({
          id,
          name: `Campaign ${id}`,
          clientName: 'Imported Client',
          platform: data.observations.find((o) => o.campaignId === id)?.platform || 'Meta',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          startDate: data.observations[0]?.date || '2024-01-01',
          endDate: null,
          currency: 'INR',
          budget: 10000,
          description: 'Auto-generated from imported observations',
        }));
      }

      let importedCreatives = data.creatives || [];
      if (importedCreatives.length === 0) {
        const uniqueCrIds = Array.from(new Set(data.observations.map((o) => o.creativeId)));
        importedCreatives = uniqueCrIds.map((id) => {
          const sampleObs = data.observations.find((o) => o.creativeId === id);
          return {
            id,
            campaignId: sampleObs?.campaignId || 'cmp-1',
            name: `Creative ${id}`,
            thumbnailUrl: '',
            creativeFormat: 'VIDEO',
            visualStyle: '2D Cartoon',
            animationStyle: 'Flat Animation',
            characterUsage: 'Cartoon Character',
            durationSeconds: 15,
            aspectRatio: '9:16',
            primaryMessage: '',
            callToAction: 'Learn More',
            tags: ['imported'],
          };
        });
      }

      setCampaigns(importedCampaigns);
      setCreatives(importedCreatives);
      setObservations(data.observations);
      setIsDemoMode(false);

      localStorage.setItem(
        LOCAL_STORAGE_KEY_DATA,
        JSON.stringify({
          campaigns: importedCampaigns,
          creatives: importedCreatives,
          observations: data.observations,
        })
      );
    } catch (e) {
      console.error('Failed to save imported dataset to localStorage:', e);
    }
  };

  const updateCreative = (creativeId: string, updates: Partial<Creative>) => {
    setCreatives((prev) =>
      prev.map((cr) => {
        if (cr.id === creativeId) {
          const updated = { ...cr, ...updates };
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CREATIVE_EDITS);
            const edits = raw ? JSON.parse(raw) : {};
            edits[creativeId] = updates;
            localStorage.setItem(LOCAL_STORAGE_KEY_CREATIVE_EDITS, JSON.stringify(edits));
          } catch (e) {
            console.error('Failed to persist creative edit:', e);
          }
          return updated;
        }
        return cr;
      })
    );
  };

  const saveView = (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newView: SavedView = {
      ...view,
      id: `view-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newView, ...savedViews];
    setSavedViews(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SAVED_VIEWS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save view to localStorage:', e);
    }
  };

  const deleteView = (id: string) => {
    const updated = savedViews.filter((v) => v.id !== id);
    setSavedViews(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SAVED_VIEWS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete view from localStorage:', e);
    }
  };

  const toggleAudienceData = (enabled: boolean) => {
    setIsAudienceDataAvailable(enabled);
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <DataContext.Provider
      value={{
        campaigns,
        creatives,
        observations,
        audienceObservations,
        filteredObservations,
        filteredCampaigns,
        filteredCreatives,
        metrics,
        previousMetrics,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        isDemoMode,
        resetToDemo,
        importDataset,
        updateCreative,
        savedViews,
        saveView,
        deleteView,
        isAudienceDataAvailable,
        toggleAudienceData,
        activeFilterCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
