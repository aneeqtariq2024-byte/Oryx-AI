'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Cpu, Zap, Layers, Sparkles, Brain, Rocket, Crown, Wifi, WifiOff } from 'lucide-react';
import { ModelOption } from '@/types/chat';
import { BOSS_MODEL, ALL_MODELS } from '@/lib/models';

const PROVIDER_ORDER = ['Claude', 'Groq', 'Gemini', 'OpenRouter', 'NVIDIA', 'Ollama'] as const;

const MODELS: ModelOption[] = ALL_MODELS.map((m) => ({
  id: m.id,
  name: m.name,
  description: m.description,
  speed: m.speed,
  context: m.context,
  icon: m.icon,
  provider: m.provider,
}));

interface ModelSelectorProps {
  selectedModel: ModelOption;
  onSelectModel: (model: ModelOption) => void;
}

export default function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'running' | 'offline'>('unknown');
  const [installedOllamaModels, setInstalledOllamaModels] = useState<Set<string>>(new Set());

  // Fetch locally installed Ollama models
  useEffect(() => {
    async function checkOllama() {
      try {
        const res = await fetch('/api/ollama-models');
        const data = await res.json();
        if (data.running) {
          setOllamaStatus('running');
          setInstalledOllamaModels(new Set(data.models));
        } else {
          setOllamaStatus('offline');
        }
      } catch {
        setOllamaStatus('offline');
      }
    }
    checkOllama();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelIcon = (iconName?: string, size = 14) => {
    switch (iconName) {
      case 'Zap':
        return <Zap size={size} className="text-amber-400" />;
      case 'Layers':
        return <Layers size={size} className="text-indigo-400" />;
      case 'Sparkles':
        return <Sparkles size={size} className="text-purple-400" />;
      case 'Brain':
        return <Brain size={size} className="text-emerald-400" />;
      case 'Rocket':
        return <Rocket size={size} className="text-rose-400" />;
      default:
        return <Cpu size={size} className="text-emerald-400" />;
    }
  };

  const isBoss = !!selectedModel.isBoss;

  // Filter: show Ollama models only if they are installed locally
  const visibleModels = MODELS.filter((m) => {
    if (m.provider === 'Ollama') {
      if (ollamaStatus === 'offline') return false;
      const modelName = m.id.replace(/^ollama\//i, '');
      return installedOllamaModels.has(modelName);
    }
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
          isBoss
            ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-indigo-500/15 text-emerald-300'
            : 'border-white/10 bg-[#303030]/60 hover:bg-[#303030] text-[#ececec]'
        } text-xs font-medium`}
      >
        {isBoss ? <Crown size={13} /> : null}
        <span className="truncate max-w-[120px] sm:max-w-none">{selectedModel.name}</span>
        {!isBoss && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
            selectedModel.speed === 'Lightning'
              ? 'bg-amber-500/15 text-amber-300'
              : selectedModel.speed === 'Power'
              ? 'bg-rose-500/15 text-rose-300'
              : 'bg-emerald-500/15 text-emerald-300'
          }`}>
            {selectedModel.speed || 'Fast'}
          </span>
        )}
        <ChevronDown size={13} className={`text-[#afafaf] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-[340px] bg-[#2a2a2a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Boss Agent card */}
            <button
              onClick={() => {
                onSelectModel(BOSS_MODEL as ModelOption);
                setIsOpen(false);
              }}
              className={`w-full text-left m-2 p-3 rounded-xl border transition-all flex items-center gap-3 ${
                isBoss
                  ? 'bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border-emerald-500/40'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 text-white shrink-0">
                <Crown size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#ececec]">Boss Agent Mode</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    AUTO
                  </span>
                </div>
                <p className="text-[11px] text-[#8f8f8f] mt-0.5 leading-snug">
                  AI analyzes your task &amp; picks the best model. Free tier finished? Auto-switches to the next best one.
                </p>
              </div>
              {isBoss && <Check size={15} className="text-emerald-300 shrink-0" />}
            </button>

            <div className="max-h-[340px] overflow-y-auto px-2 pb-2 space-y-2 custom-scrollbar">
              {PROVIDER_ORDER.map((prov) => {
                if (prov === 'Ollama' && ollamaStatus === 'offline') return null;
                const models = visibleModels.filter((m) => m.provider === prov);
                if (!models.length) return null;

                // Ollama section header with status indicator
                const sectionHeader = prov === 'Ollama' ? (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#8f8f8f] uppercase px-2 pt-1.5 pb-1">
                    <Wifi size={10} className="text-cyan-400" />
                    {prov} · Local
                    <span className="text-[8px] px-1 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      {installedOllamaModels.size} installed
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] font-semibold tracking-wider text-[#8f8f8f] uppercase px-2 pt-1.5 pb-1">{prov}</div>
                );

                return (
                  <div key={prov}>
                    {sectionHeader}
                    <div className="space-y-0.5">
                      {models.map((model) => {
                        const isSelected = selectedModel.id === model.id;
                        return (
                          <button
                            key={model.id}
                            onClick={() => {
                              onSelectModel(model);
                              setIsOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                              isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex gap-2.5 items-start min-w-0">
                              <div className="p-2 rounded-lg bg-white/5 mt-0.5">{getModelIcon(model.icon)}</div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-semibold text-[#ececec]">{model.name}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${
                                    prov === 'Claude'
                                      ? 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                                      : prov === 'Groq'
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                      : prov === 'Gemini'
                                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                      : prov === 'NVIDIA'
                                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                      : prov === 'Ollama'
                                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                                      : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                  }`}>{prov}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-[#afafaf] font-medium">
                                    {model.context}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#8f8f8f] mt-0.5 line-clamp-1">{model.description}</p>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-white mt-1 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Ollama offline notice */}
              {ollamaStatus !== 'running' && (
                <div className="px-2 py-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <WifiOff size={14} className="text-[#8f8f8f] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-[#8f8f8f] uppercase tracking-wider">Ollama · Local</span>
                      <p className="text-[11px] text-[#8f8f8f] mt-0.5">
                        {ollamaStatus === 'unknown' ? 'Checking...' : 'Ollama not running. Start it to use local models.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
