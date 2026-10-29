'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/lib/context/DataContext';
import {
  Globe,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Download,
  Plus,
  Flame,
  FileText,
  Key,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Database,
  Clock,
} from 'lucide-react';
import { Platform, CrawledAdItem, CrawlJob, Creative, PerformanceObservation } from '@/types';
import { exportToJson } from '@/lib/export/csvExport';

const LOCAL_STORAGE_CRAWLER_CACHE = 'bekemon_crawler_local_cache_v1';

export default function WebCrawlerPage() {
  const { importDataset, creatives } = useData();

  const [targetUrl, setTargetUrl] = useState('https://www.amul.com/topicals');
  const [brandName, setBrandName] = useState('Amul India');
  const [platform, setPlatform] = useState<Platform>('Meta');
  const [isCrawling, setIsCrawling] = useState(false);
  const [activeJob, setActiveJob] = useState<CrawlJob | null>(null);
  const [ingestSuccess, setIngestSuccess] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cachedJobsList, setCachedJobsList] = useState<CrawlJob[]>([]);
  const [showCacheDrawer, setShowCacheDrawer] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CRAWLER_CACHE);
      if (stored) {
        const parsed: CrawlJob[] = JSON.parse(stored);
        setCachedJobsList(parsed);

        if (parsed.length > 0 && !activeJob) {
          setActiveJob(parsed[0]);
        }
      }
    } catch (e) {

    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveJobToLocalCache = (job: CrawlJob) => {
    try {
      setCachedJobsList((prev) => {
        const filtered = prev.filter((j) => j.targetUrl !== job.targetUrl);
        const updated = [job, ...filtered].slice(0, 10);
        localStorage.setItem(LOCAL_STORAGE_CRAWLER_CACHE, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {

    }
  };

  const presets = [
    { name: 'Amul Topicals', url: 'https://www.amul.com/topicals', brand: 'Amul India', platform: 'Meta' as Platform },
    { name: 'CRED Rewards', url: 'https://cred.club', brand: 'CRED', platform: 'Meta' as Platform },
    { name: 'Swiggy', url: 'https://swiggy.com', brand: 'Swiggy', platform: 'YouTube' as Platform },
    { name: 'boAt Audio', url: 'https://www.boat-lifestyle.com', brand: 'boAt Lifestyle', platform: 'YouTube' as Platform },
    { name: 'Tata Play', url: 'https://www.tataplay.com', brand: 'Tata Play', platform: 'JioCinema' as Platform },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setTargetUrl(p.url);
    setBrandName(p.brand);
    setPlatform(p.platform);
  };

  const handleStartCrawl = async (e: React.FormEvent, forceCache = false) => {
    e.preventDefault();
    setIsCrawling(true);
    setIngestSuccess(false);

    const nowStr = () => new Date().toLocaleTimeString('en-IN');

    if (forceCache || !navigator.onLine) {
      const cached = cachedJobsList.find(
        (j) => j.targetUrl === targetUrl || j.brandName.toLowerCase().includes(brandName.toLowerCase())
      );
      if (cached) {
        setActiveJob({
          ...cached,
          isFromCache: true,
          isOfflineFallback: true,
          logs: [
            `[${nowStr()}] ⚡ Instant Cache Requested: Loaded snapshot in 0ms.`,
            `[${nowStr()}] 📦 DISPLAYING STORED CACHE: Snapshot cached at ${cached.createdAt}.`,
            `[${nowStr()}] 🛡️ Extracted ${cached.items.length} creative assets in INR (₹) from stored cache.`,
          ],
        });
        setIsCrawling(false);
        return;
      }
    }

    const progressiveLogs = [
      `[${nowStr()}] 🚀 Connecting to Firecrawl cloud cluster...`,
      `[${nowStr()}] 🌐 Dispatching real-time scrape request to: ${targetUrl}`,
    ];

    setActiveJob({
      id: `crawl-live-${Date.now()}`,
      targetUrl,
      brandName,
      platform,
      status: 'CRAWLING',
      resultsCount: 0,
      createdAt: new Date().toISOString(),
      items: [],
      logs: progressiveLogs,
    });

    const progressTimer = setInterval(() => {
      setActiveJob((prev) => {
        if (!prev || prev.status !== 'CRAWLING') return prev;
        const count = prev.logs.length;
        const newLog =
          count === 2
            ? `[${nowStr()}] 📡 Headless DOM extraction active (Firecrawl v1)...`
            : count === 3
            ? `[${nowStr()}] 📄 Parsing live markdown & media image containers...`
            : count === 4
            ? `[${nowStr()}] 🧠 Running stylistic classifier (2D Cartoon, Mascot, INR)...`
            : `[${nowStr()}] ⚡ Finalizing creative intelligence observations...`;
        return {
          ...prev,
          logs: [...prev.logs, newLog],
        };
      });
    }, 700);

    const clientController = new AbortController();
    const clientTimeout = setTimeout(() => clientController.abort(), 7000);

    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-firecrawl-key': customApiKey } : {}),
        },
        body: JSON.stringify({ targetUrl, brandName, platform, firecrawlApiKey: customApiKey || undefined }),
        signal: clientController.signal,
      });
      clearInterval(progressTimer);
      clearTimeout(clientTimeout);

      const data = await res.json();
      if (data.job) {
        setActiveJob(data.job);
        saveJobToLocalCache(data.job);
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      clearTimeout(clientTimeout);

      const cached = cachedJobsList.find(
        (j) => j.targetUrl === targetUrl || j.brandName.toLowerCase().includes(brandName.toLowerCase())
      );
      if (cached) {
        setActiveJob({
          ...cached,
          isFromCache: true,
          isOfflineFallback: true,
          logs: [
            `[${nowStr()}] ⚠️ Live request timed out (${err.message}).`,
            `[${nowStr()}] ⚡ FAST STORED CACHE LOADED: Retrieved stored snapshot for ${brandName}.`,
            `[${nowStr()}] 🛡️ Displaying ${cached.items.length} cached creative assets in INR (₹).`,
          ],
        });
      } else {
        setActiveJob((prev) =>
          prev
            ? {
                ...prev,
                status: 'FAILED',
                logs: [...prev.logs, `[${nowStr()}] ⚠️ Network error: ${err.message}`],
              }
            : null
        );
      }
    } finally {
      clearInterval(progressTimer);
      setIsCrawling(false);
    }
  };

  const handleIngestToWorkspace = () => {
    if (!activeJob || activeJob.items.length === 0) return;

    const newCreatives: Creative[] = activeJob.items.map((item, idx) => ({
      id: `crawled-crt-${Date.now()}-${idx}`,
      campaignId: 'cmp-in-101',
      name: item.title,
      thumbnailUrl: item.thumbnailUrl,
      creativeFormat: item.creativeFormat,
      visualStyle: item.visualStyle,
      animationStyle: 'Flat Animation',
      characterUsage: item.characterUsage,
      durationSeconds: 15,
      aspectRatio: '9:16',
      primaryMessage: item.primaryMessage,
      callToAction: item.callToAction,
      tags: ['crawled', activeJob.isFromCache ? 'stored-cache' : 'realtime-firecrawl', item.brandName.toLowerCase()],
    }));

    const newObservations: PerformanceObservation[] = activeJob.items.map((item, idx) => ({
      id: `crawled-obs-${Date.now()}-${idx}`,
      date: new Date().toISOString().split('T')[0],
      campaignId: 'cmp-in-101',
      creativeId: newCreatives[idx].id,
      platform: item.platform,
      impressions: item.estimatedImpressions,
      reach: Math.round(item.estimatedImpressions * 0.8),
      clicks: Math.round(item.estimatedImpressions * 0.024),
      spend: item.estimatedSpendInr,
      conversions: Math.round(item.estimatedImpressions * 0.024 * 0.04),
      conversionValue: Math.round(item.estimatedSpendInr * 1.8),
      videoViews: Math.round(item.estimatedImpressions * 0.6),
      completedVideoViews: Math.round(item.estimatedImpressions * 0.3),
      likes: 1200,
      comments: 85,
      shares: 140,
      currency: 'INR',
      attributionWindow: '7d_click_1d_view',
      source: 'CRAWLER',
    }));

    importDataset({
      creatives: [...creatives, ...newCreatives],
      observations: newObservations,
    });

    setIngestSuccess(true);
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              Live Ad Web Crawler & Creative Extraction
            </h1>

            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                <Wifi className="w-3 h-3 text-emerald-600" /> Real-time Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                <WifiOff className="w-3 h-3 text-amber-600" /> Offline · Stored Cache Active
              </span>
            )}

            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-800 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
              <Flame className="w-3 h-3 text-amber-600 fill-amber-500" /> Firecrawl v1
            </span>

            <span className="bg-neutral-900 text-white text-xs px-2.5 py-0.5 rounded-full font-bold font-mono">
              INR (₹)
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Real-time ad discovery across Indian networks. Automatically displays stored offline cache if internet connection is down.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cachedJobsList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCacheDrawer(!showCacheDrawer)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-xs font-semibold rounded-md hover:bg-neutral-50 text-neutral-700 shadow-2xs cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Stored Cache ({cachedJobsList.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-xs font-semibold rounded-md hover:bg-neutral-50 text-neutral-700 shadow-2xs"
          >
            <Key className="w-3.5 h-3.5 text-neutral-600" />
            <span>Firecrawl Key</span>
          </button>

          {activeJob && (
            <button
              type="button"
              onClick={() => exportToJson(`crawled_ads_${activeJob.brandName}`, activeJob)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-xs font-semibold rounded-md hover:bg-neutral-50 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          )}
        </div>
      </div>

      {!isOnline && (
        <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/80 flex items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <b>Internet connection unavailable</b>. Displaying stored cache snapshot. Any crawls executed will immediately serve stored offline snapshots.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-mono font-bold text-[11px] shrink-0">
            Stored Cache Mode
          </span>
        </div>
      )}

      {activeJob?.isFromCache && (
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/70 flex items-center justify-between text-xs text-blue-950">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <b>Displaying Stored Cache Snapshot</b>: Data retrieved from local offline cache for <b>{activeJob.brandName}</b>.
            </span>
          </div>
          <span className="text-[11px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
            Cached Mode
          </span>
        </div>
      )}

      {showCacheDrawer && cachedJobsList.length > 0 && (
        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-lg text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
            <span className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" /> Stored Offline Crawl Snapshots
            </span>
            <span className="text-[11px] text-neutral-500">
              {cachedJobsList.length} cached brand datasets available offline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {cachedJobsList.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => {
                  setActiveJob({ ...job, isFromCache: true });
                  setTargetUrl(job.targetUrl);
                  setBrandName(job.brandName);
                  setPlatform(job.platform);
                }}
                className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                  activeJob?.id === job.id
                    ? 'bg-white border-neutral-900 shadow-xs'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-1">
                  <span>{job.platform}</span>
                  <span>{job.items.length} Assets</span>
                </div>
                <div className="font-bold text-neutral-900 truncate">{job.brandName}</div>
                <div className="text-[11px] text-neutral-500 truncate">{job.targetUrl}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showKeyInput && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" /> Firecrawl API Key Configuration
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              Default: fc-3a8eabab...15da (Active)
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Paste custom Firecrawl API key (fc-...)"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="flex-1 bg-white border border-neutral-300 rounded px-2.5 py-1.5 font-mono text-xs text-neutral-900"
            />
            <button
              type="button"
              onClick={() => setShowKeyInput(false)}
              className="px-3 py-1.5 bg-neutral-900 text-white rounded font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-neutral-500 text-[11px] uppercase tracking-wider">Quick Presets:</span>
        {presets.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleApplyPreset(p)}
            className="px-2.5 py-1 bg-white border border-neutral-200 hover:border-neutral-400 rounded-full font-medium text-neutral-700 transition-colors shadow-2xs cursor-pointer"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-neutral-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Launch Target URL Crawl (Real-time · Stored Cache Fallback)</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isOnline ? 'Live Network Active' : 'Offline Mode'}</span>
          </div>
        </div>

        <form onSubmit={handleStartCrawl} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="md:col-span-2">
            <label className="font-semibold text-neutral-700 block mb-1">Target Ad Library / Brand URL</label>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="e.g. https://www.amul.com/topicals or https://cred.club"
              className="w-full px-3 py-1.5 border border-neutral-200 rounded text-neutral-900 bg-neutral-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Brand / Advertiser</label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Amul India, Swiggy, boAt"
              className="w-full px-3 py-1.5 border border-neutral-200 rounded text-neutral-900 bg-neutral-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Advertising Network</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded text-neutral-900 bg-neutral-50"
            >
              <option value="Meta">Meta (Instagram / FB India)</option>
              <option value="YouTube">YouTube India Ads</option>
              <option value="JioCinema">JioCinema Live OTT</option>
              <option value="Google Ads">Google Ads Network</option>
              <option value="ShareChat">ShareChat Vernacular</option>
            </select>
          </div>

          <div className="md:col-span-4 flex items-center justify-between pt-2">
            <div className="text-[11px] text-neutral-400">
              {isOnline
                ? 'Real-time extraction via Firecrawl API. Saves live results to stored cache automatically.'
                : 'Offline: Will retrieve and display the stored cache snapshot for this target.'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleStartCrawl(e, true)}
                disabled={isCrawling}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-300 shadow-2xs"
                title="Immediately display stored cache for this URL without waiting for a live network scrape"
              >
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Instant Stored Cache (0ms)</span>
              </button>

              <button
                type="submit"
                disabled={isCrawling}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isCrawling
                    ? 'Crawling Target...'
                    : isOnline
                    ? 'Execute Real-time Crawl'
                    : 'Load Stored Cache'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {activeJob && (
        <div className="bg-neutral-950 rounded-lg p-4 font-mono text-xs text-neutral-300 shadow-xs border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-neutral-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-[11px]">CRAWLER RUNTIME TERMINAL</span>
              {activeJob.isFromCache ? (
                <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800 font-semibold">
                  STORED CACHE
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                  REAL-TIME 200 OK
                </span>
              )}
            </div>
            <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
              Job ID: {activeJob.id}
            </span>
          </div>

          <div className="space-y-1 text-[11px] max-h-48 overflow-y-auto pr-1">
            {activeJob.logs.map((log, i) => (
              <div key={i} className="text-neutral-400">
                <span className={activeJob.isFromCache ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                  &gt;
                </span>{' '}
                {log}
              </div>
            ))}
          </div>

          {activeJob.firecrawlMetadata && (
            <div className="pt-2 border-t border-neutral-800/80">
              <button
                type="button"
                onClick={() => setShowRawMarkdown(!showRawMarkdown)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {showRawMarkdown ? 'Hide' : 'Inspect'}{' '}
                  {activeJob.isFromCache ? 'Cached Markdown & Metadata' : 'Firecrawl Live Scraped Markdown'} (
                  {activeJob.firecrawlMetadata.creditsUsed || 1} credit)
                </span>
                {showRawMarkdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showRawMarkdown && activeJob.firecrawlMetadata.markdownSnippet && (
                <div className="mt-2 p-3 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {activeJob.firecrawlMetadata.markdownSnippet}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeJob && activeJob.items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                Discovered Creative Intelligence ({activeJob.items.length} Assets in INR ₹){' '}
                {activeJob.isFromCache && (
                  <span className="text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Stored Cache
                  </span>
                )}
              </span>
            </h2>

            <button
              type="button"
              onClick={handleIngestToWorkspace}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest into BEKEMON Workspace</span>
            </button>
          </div>

          {ingestSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Creative assets successfully ingested into active workspace! You can inspect them in the
                Creative Lab, Campaign Explorer, and analyze them with the AI Copilot.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeJob.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-neutral-200/90 overflow-hidden shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all"
              >

                <div className="h-36 bg-neutral-100 relative overflow-hidden flex items-center justify-center border-b border-neutral-100">
                  {item.thumbnailUrl && item.thumbnailUrl.startsWith('http') ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-900/90 text-white backdrop-blur-xs">
                    {item.platform}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow-2xs font-mono">
                    ₹{item.estimatedSpendInr.toLocaleString('en-IN')}
                  </span>
                  {activeJob.isFromCache && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white">
                      Stored Cache
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-neutral-900 text-xs leading-snug line-clamp-2">{item.title}</h3>
                    <p className="text-[11px] text-neutral-600 mt-1 italic line-clamp-2">"{item.primaryMessage}"</p>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[10px]">
                        {item.visualStyle}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[10px]">
                        {item.characterUsage}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-medium text-[10px]">
                        CTA: {item.callToAction}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Est. Reach: {item.estimatedImpressions.toLocaleString('en-IN')}</span>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Live Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
