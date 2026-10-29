'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Key,
  RotateCcw,
  Bot,
  User,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ClipboardPaste,
} from 'lucide-react';
import { useData } from '@/lib/context/DataContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const STORAGE_KEY_GEMINI_KEY = 'bekemon_gemini_api_key';
const STORAGE_KEY_CHAT_HISTORY = 'bekemon_chat_history_v1';
const STORAGE_KEY_PREFERRED_MODEL = 'bekemon_preferred_model_v1';

export function ChatbotWidget() {
  const { campaigns, creatives, metrics } = useData();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [preferredModel, setPreferredModel] = useState<string>('auto');
  const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySavedToast, setKeySavedToast] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Namaste! I am the **Bekemon AI Copilot**, your intelligence assistant for Indian creative marketing campaigns. All insights, unit economics, and media budgets are strictly grounded in **INR (₹)**.\n\nAsk me about cartoon & mascot CTRs, platform comparisons (Meta vs JioCinema vs YouTube), or budget reallocation strategies!',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    try {
      const storedKey = localStorage.getItem(STORAGE_KEY_GEMINI_KEY);
      if (storedKey) {
        setGeminiKey(storedKey);
        setKeyInput(storedKey);
      }

      const storedModel = localStorage.getItem(STORAGE_KEY_PREFERRED_MODEL);
      if (storedModel) {
        setPreferredModel(storedModel);
      }

      const storedHistory = localStorage.getItem(STORAGE_KEY_CHAT_HISTORY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {

    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      try {
        localStorage.setItem(STORAGE_KEY_CHAT_HISTORY, JSON.stringify(messages.slice(-20)));
      } catch (e) {

      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = keyInput.trim();
    setGeminiKey(cleanKey);
    try {
      if (cleanKey) {
        localStorage.setItem(STORAGE_KEY_GEMINI_KEY, cleanKey);
      } else {
        localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
      }
      localStorage.setItem(STORAGE_KEY_PREFERRED_MODEL, preferredModel);
      setKeySavedToast(true);
      setTimeout(() => {
        setKeySavedToast(false);
        setIsKeyDrawerOpen(false);
      }, 1200);
    } catch (e) {

    }
  };

  const handleResetToDefault = () => {
    setKeyInput('');
    setGeminiKey('');
    setPreferredModel('auto');
    setTestResult(null);
    try {
      localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
      localStorage.setItem(STORAGE_KEY_PREFERRED_MODEL, 'auto');
    } catch (e) {

    }
  };

  const handleTestConnection = async () => {
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testOnly: true,
          apiKey: keyInput.trim() || undefined,
          preferredModel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || `Connected in ${data.latencyMs}ms!`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Please check key or quota.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Timeout testing Google Gemini connection.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setKeyInput(text.trim());
    } catch (e) {

    }
  };

  const handleDismissMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRetryLastPrompt = async (model: string = 'gemini-flash-lite-latest') => {
    setPreferredModel(model);
    try {
      localStorage.setItem(STORAGE_KEY_PREFERRED_MODEL, model);
    } catch (e) {}

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;

    setMessages((prev) =>
      prev.filter(
        (m) =>
          !m.content.includes('Error') &&
          !m.content.includes('high demand') &&
          !m.content.includes('Spikes in demand')
      )
    );

    await handleSendMessage(lastUser.content, model);
  };

  const handleSendMessage = async (userPrompt?: string, overrideModel?: string) => {
    const promptToSend = userPrompt || input.trim();
    if (!promptToSend || isLoading) return;

    if (!userPrompt) setInput('');

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages];
    const lastMsg = newMessages[newMessages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== promptToSend) {
      newMessages.push(userMsg);
    }

    setMessages(newMessages);
    setIsLoading(true);

    if (!navigator.onLine) {
      setTimeout(() => {
        const offlineReply: Message = {
          id: `bot-offline-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Internet Connection Offline (Stored Cache Active)**\n\nReal-time Google Gemini generation is unavailable without an internet connection.\n\nHowever, your active workspace cache is intact:\n- **Tracked Campaigns**: ${campaigns.length} campaigns\n- **Analyzed Media Spend**: ₹${Math.round(metrics.spend).toLocaleString('en-IN')}\n- **Top Creative Style**: 2D Cartoon & Mascot Creatives\n\nReconnect to the internet to resume live generative AI chats.`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, offlineReply]);
        setIsLoading(false);
      }, 400);
      return;
    }

    try {

      const contextData = {
        totalSpend: metrics.spend,
        campaignsCount: campaigns.length,
        creativesCount: creatives.length,
        topStyle: '2D Cartoon & Mascot Creatives',
        topPlatform: 'Meta & JioCinema',
        summaryMetrics: {
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          conversions: metrics.conversions,
          ctr: metrics.ctr ? `${metrics.ctr.toFixed(2)}%` : null,
          cpc: metrics.cpc ? `₹${metrics.cpc.toFixed(2)}` : null,
          cpa: metrics.costPerConversion ? `₹${metrics.costPerConversion.toFixed(2)}` : null,
        },
      };

      const apiHistory = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiHistory,
          apiKey: geminiKey.trim() || undefined,
          preferredModel: overrideModel || preferredModel,
          contextData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresApiKey) {
          setIsKeyDrawerOpen(true);
        }
        throw new Error(data.error || 'Failed to get response from Gemini API');
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error**: ${err.message || 'Unable to connect to Gemini API.'}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const promptChips = [
    'Which creative style has the lowest CPA in ₹?',
    'Compare JioCinema vs YouTube campaign efficiency',
    'How should we allocate ₹10 Lakhs of ad budget?',
    'Explain why 2D cartoon mascots perform well in India',
  ];

  return (
    <>

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-neutral-700/80 group cursor-pointer"
          aria-label="Open Bekemon AI Copilot"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-semibold tracking-wide">Bekemon Copilot</span>
          <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 font-mono">
            Gemini
          </span>
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-2xl border border-neutral-300 flex flex-col overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-[95vw] md:w-[680px] h-[85vh] max-h-[820px]'
              : 'w-[92vw] sm:w-[420px] h-[600px] max-h-[88vh]'
          }`}
        >

          <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white">Bekemon Copilot</h3>
                  <button
                    type="button"
                    onClick={() => setIsKeyDrawerOpen(true)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900 transition-colors cursor-pointer"
                    title="Click to configure API Key or Model"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      {preferredModel === 'gemini-flash-lite-latest'
                        ? 'Flash Lite (Instant)'
                        : preferredModel === 'gemini-3.1-flash-lite'
                        ? 'Gemini 3.1'
                        : preferredModel === 'gemini-2.5-flash'
                        ? 'Gemini 2.5'
                        : 'Auto-Failover'}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Grounded in Active Campaign Data · Strictly INR (₹)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsKeyDrawerOpen(!isKeyDrawerOpen)}
                className={`p-1.5 rounded transition-colors ${
                  isKeyDrawerOpen
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title="Google Gemini Key & Model Setup"
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      role: 'assistant',
                      content: 'Chat cleared. How can I assist with your Indian ad campaigns in ₹ today?',
                      timestamp: new Date().toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    },
                  ]);
                  try {
                    localStorage.removeItem(STORAGE_KEY_CHAT_HISTORY);
                  } catch (e) {}
                }}
                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                title="Clear Conversation History"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors hidden sm:block"
                title={isExpanded ? 'Collapse Size' : 'Expand View'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isKeyDrawerOpen && (
            <div className="bg-neutral-50 p-4 border-b border-neutral-300 text-xs shrink-0 max-h-[70vh] overflow-y-auto space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 text-sm">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Google Gemini Key & Model Setup</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKeyDrawerOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900 flex items-center gap-1 text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Generate Free Google API Key
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[10px] shadow-2xs transition-colors"
                  >
                    <span>Get Key (Google AI Studio)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[10px] text-neutral-600 leading-relaxed">
                  1. Click <b>Get Key</b> above &rarr; 2. Click <b>"Create API key"</b> &rarr; 3. Paste it below and click Save.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-neutral-800 text-[11px]">
                      Your Gemini API Key
                    </label>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {geminiKey ? '● Custom Key Saved' : '● Default Server Key Active'}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder="AIzaSy... (leave empty to use server default key)"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 pr-16 text-neutral-900 font-mono text-xs focus:outline-blue-600 shadow-2xs"
                    />
                    <div className="absolute right-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePasteKey}
                        className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                        title="Paste from Clipboard"
                      >
                        <ClipboardPaste className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                        title={showKey ? 'Hide key' : 'Show key'}
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-800 text-[11px] block mb-1.5">
                    Engine / Model Priority (Bypass High Demand)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPreferredModel('gemini-flash-lite-latest')}
                      className={`p-2 rounded border text-left transition-all cursor-pointer ${
                        preferredModel === 'gemini-flash-lite-latest'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-semibold shadow-2xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Flash Lite</span>
                        <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          Zero Wait
                        </span>
                      </div>
                      <div className="text-[9px] opacity-70 mt-0.5">High throughput & concurrency</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredModel('auto')}
                      className={`p-2 rounded border text-left transition-all cursor-pointer ${
                        preferredModel === 'auto'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-semibold shadow-2xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Auto-Failover</span>
                        <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-400 font-bold">
                          Adaptive
                        </span>
                      </div>
                      <div className="text-[9px] opacity-70 mt-0.5">Skips busy models automatically</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredModel('gemini-3.1-flash-lite')}
                      className={`p-2 rounded border text-left transition-all cursor-pointer ${
                        preferredModel === 'gemini-3.1-flash-lite'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-semibold shadow-2xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Gemini 3.1 Lite</span>
                      </div>
                      <div className="text-[9px] opacity-70 mt-0.5">Next-gen analytical reasoning</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredModel('gemini-2.5-flash')}
                      className={`p-2 rounded border text-left transition-all cursor-pointer ${
                        preferredModel === 'gemini-2.5-flash'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-semibold shadow-2xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Gemini 2.5 Flash</span>
                      </div>
                      <div className="text-[9px] opacity-70 mt-0.5">Balanced multimodal engine</div>
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded text-[11px] flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="leading-tight">{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTestingKey}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-medium border border-neutral-300 flex items-center gap-1 cursor-pointer"
                    >
                      {isTestingKey ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Testing...
                        </>
                      ) : (
                        'Test Key & Model'
                      )}
                    </button>
                    {geminiKey && (
                      <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="px-2 py-1.5 text-neutral-500 hover:text-red-600 text-xs"
                        title="Clear custom key and revert to server default"
                      >
                        Reset Key
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsKeyDrawerOpen(false)}
                      className="px-3 py-1.5 border border-neutral-200 rounded text-neutral-600 hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      {keySavedToast ? (
                        <>
                          <Check className="w-3 h-3" /> Saved!
                        </>
                      ) : (
                        'Save & Apply'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="px-3.5 py-1.5 bg-neutral-100/70 border-b border-neutral-200/80 flex items-center justify-between text-[11px] text-neutral-600 shrink-0">
            <span className="font-medium truncate">
              Dataset: <b>{campaigns.length} Campaigns</b> · Spend: <b>₹{Math.round(metrics.spend).toLocaleString('en-IN')}</b>
            </span>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-neutral-200 text-neutral-500">
              INR (₹)
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-neutral-50/50 text-xs">
            {messages.map((m) => {
              const isErrorMsg =
                m.role === 'assistant' &&
                (m.content.includes('Error') ||
                  m.content.includes('high demand') ||
                  m.content.includes('Spikes in demand'));

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-neutral-900 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-lg px-3.5 py-2.5 relative group ${
                      m.role === 'user'
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : isErrorMsg
                        ? 'bg-red-50/90 text-red-950 border border-red-200 shadow-2xs'
                        : 'bg-white text-neutral-800 border border-neutral-200 shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-[12px]">
                      {formatChatMarkdown(m.content)}
                    </div>

                    {isErrorMsg && (
                      <div className="mt-2.5 pt-2 border-t border-red-200/70 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRetryLastPrompt('gemini-flash-lite-latest')}
                          className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[11px] font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Retry with Flash Lite (No Wait)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsKeyDrawerOpen(true)}
                          className="px-2 py-1 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Key className="w-3 h-3 text-blue-600" /> Key & Model Setup
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissMessage(m.id)}
                          className="px-2 py-1 text-neutral-400 hover:text-neutral-700 text-[11px]"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-neutral-100/60 text-[10px] text-neutral-400">
                      <span>{m.timestamp}</span>
                      {m.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(m.id, m.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-neutral-700"
                          title="Copy Response"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-neutral-900 text-amber-300 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-neutral-200 rounded-lg px-3.5 py-2.5 shadow-2xs flex items-center gap-2 text-neutral-500 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Analyzing creative performance in ₹...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length < 3 && !isLoading && (
            <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-200/60 overflow-x-auto whitespace-nowrap flex gap-1.5 shrink-0 scrollbar-none">
              {promptChips.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="text-[11px] bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 px-2.5 py-1 rounded-full shrink-0 transition-colors shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about campaign CTR, creatives, or ₹ budget..."
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Send Message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-neutral-300" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function formatChatMarkdown(content: string) {
  const lines = content.split('\n');
  return lines.map((line, idx) => {

    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-neutral-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (line.startsWith('# ')) {
      return (
        <h4 key={idx} className="text-sm font-bold text-neutral-900 mt-2 mb-1">
          {formattedLine}
        </h4>
      );
    }
    if (line.startsWith('## ') || line.startsWith('### ')) {
      return (
        <h5 key={idx} className="text-xs font-bold text-neutral-900 mt-1.5 mb-0.5">
          {formattedLine}
        </h5>
      );
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
          <span className="text-blue-600 font-bold">•</span>
          <span>{formattedLine}</span>
        </div>
      );
    }
    return (
      <div key={idx} className={line.trim() === '' ? 'h-2' : ''}>
        {formattedLine}
      </div>
    );
  });
}
