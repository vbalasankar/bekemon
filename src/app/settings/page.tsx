'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/lib/context/DataContext';
import {
  Settings,
  HardDrive,
  Database,
  Sliders,
  Shield,
  Trash2,
  Check,
  RotateCcw,
  Info,
  Sparkles,
  Flame,
  Key,
} from 'lucide-react';

export default function SettingsPage() {
  const { isDemoMode, resetToDemo, savedViews } = useData();

  const [currency, setCurrency] = useState('INR');
  const [density, setDensity] = useState('compact');
  const [defaultWindow, setDefaultWindow] = useState('7d_click_1d_view');
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [firecrawlApiKey, setFirecrawlApiKey] = useState('');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  useEffect(() => {
    try {
      let totalBytes = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalBytes += (localStorage[key].length + key.length) * 2;
        }
      }
      setStorageUsage(`${(totalBytes / 1024).toFixed(1)} KB`);

      const storedGemini = localStorage.getItem('bekemon_gemini_api_key');
      if (storedGemini) setGeminiApiKey(storedGemini);

      const storedFirecrawl = localStorage.getItem('bekemon_firecrawl_api_key');
      if (storedFirecrawl) setFirecrawlApiKey(storedFirecrawl);
    } catch (e) {
      setStorageUsage('Unavailable');
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (geminiApiKey) localStorage.setItem('bekemon_gemini_api_key', geminiApiKey.trim());
      if (firecrawlApiKey) localStorage.setItem('bekemon_firecrawl_api_key', firecrawlApiKey.trim());
    } catch (e) {

    }
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const handleClearCache = () => {
    if (confirm('Clear cached saved views and UI preferences?')) {
      localStorage.removeItem('bekemon_saved_views_v1');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">

      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">Platform Settings</h1>
        <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
          Configure agency display standards, attribution conventions, and manage local storage cache.
        </p>
      </div>

      {isSavedAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings saved to local preferences.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        <div className="bg-white rounded-lg border border-neutral-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Sliders className="w-4 h-4 text-neutral-700" />
            <h2 className="text-sm font-bold text-neutral-900">Workspace Display Preferences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Standard Currency Symbol</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 text-neutral-900"
                disabled
              >
                <option value="INR">INR (₹ - Indian Rupee) [Strict Indian Native Mode]</option>
              </select>
              <p className="text-[11px] text-neutral-400 mt-1">
                Workspace strictly configured for Indian Native campaigns in INR (₹).
              </p>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Information Density Mode</label>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 text-neutral-900"
              >
                <option value="compact">Compact (High Information Density - Swiss Grid)</option>
                <option value="comfortable">Comfortable (Standard Analytics View)</option>
              </select>
              <p className="text-[11px] text-neutral-400 mt-1">
                Controls padding and chart container heights across workspace pages.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Shield className="w-4 h-4 text-neutral-700" />
            <h2 className="text-sm font-bold text-neutral-900">Attribution & Safeguards Configuration</h2>
          </div>

          <div className="text-xs space-y-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Default Attribution Window Model
              </label>
              <select
                value={defaultWindow}
                onChange={(e) => setDefaultWindow(e.target.value)}
                className="w-full md:w-1/2 bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 text-neutral-900"
              >
                <option value="7d_click_1d_view">7-Day Click + 1-Day View (Meta Standard)</option>
                <option value="28d_click">28-Day Click (Extended Direct Attribution)</option>
                <option value="1d_click">1-Day Click (Strict Last-Touch)</option>
              </select>
              <p className="text-[11px] text-neutral-400 mt-1">
                BEKEMON displays warnings when comparing campaigns with discordant attribution models.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-neutral-900">AI Intelligence & Crawler Integrations</h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
              Client & Server Side Keys
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

            <div className="p-4 rounded-lg bg-neutral-50/80 border border-neutral-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" /> Firecrawl Crawler API
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700">
                  {firecrawlApiKey ? 'Custom Key Set' : 'Server Env Active'}
                </span>
              </div>
              <input
                type="password"
                value={firecrawlApiKey}
                onChange={(e) => setFirecrawlApiKey(e.target.value)}
                placeholder="fc-... (leave blank to use server environment key)"
                className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 font-mono text-xs text-neutral-900"
              />
              <p className="text-[11px] text-neutral-500">
                Optional browser override. If left blank, server-side FIRECRAWL_API_KEY is securely used.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-neutral-50/80 border border-neutral-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Google Gemini API
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700">
                  {geminiApiKey ? 'Custom Key Set' : 'Server Env Active'}
                </span>
              </div>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy... (leave blank to use server environment key)"
                className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 font-mono text-xs text-neutral-900"
              />
              <p className="text-[11px] text-neutral-500">
                Optional browser override. If left blank, server-side GEMINI_API_KEY is securely used.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <HardDrive className="w-4 h-4 text-neutral-700" />
            <h2 className="text-sm font-bold text-neutral-900">Local Browser Storage Inspector</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded">
              <span className="text-neutral-500">Storage Used</span>
              <div className="font-mono font-bold text-base text-neutral-900 mt-0.5">{storageUsage}</div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded">
              <span className="text-neutral-500">Saved Chart Views</span>
              <div className="font-mono font-bold text-base text-neutral-900 mt-0.5">{savedViews.length} views</div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded">
              <span className="text-neutral-500">Active Dataset</span>
              <div className="font-mono font-bold text-base text-neutral-900 mt-0.5">
                {isDemoMode ? 'Simulated Demo' : 'Custom Ingested'}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleClearCache}
              className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Saved Views Cache</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-medium shadow-2xs cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </form>

      <div className="bg-neutral-50 rounded-lg border border-neutral-200/80 p-5 text-xs text-neutral-500 space-y-2">
        <div className="font-bold text-neutral-800">Bekemon Architecture</div>
        <p>Engine Version: 1.0.0 · Apache ECharts 6.1.0 · Next.js 16.4.3 App Router · Zero Database</p>
        <p className="text-[11px] leading-relaxed">
          Built under strict analytical guarantees: zero fabricated conversion rates, weighted aggregations,
          explicit distinction between null vs zero values, and observational safeguards on creative styling.
        </p>
      </div>
    </div>
  );
}
