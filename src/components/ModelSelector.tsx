'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Cpu, Zap, Layers, Sparkles } from 'lucide-react';
import { ModelOption } from '@/types/chat';

const MODELS: ModelOption[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Oryx Llama 3.3 70B', description: 'Institutional reasoning & high throughput', speed: 'Lightning', context: '128k', icon: 'Zap' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'Oryx DeepSeek R1', description: 'Ultra-fast open reasoning & code deduction', speed: 'Lightning', context: '64k', icon: 'Cpu' },
  { id: 'gpt-5', name: 'GPT-5 Pro', description: 'Next-generation flagship reasoning engine', speed: 'Fast', context: '512k', icon: 'Cpu' },
  { id: 'gpt-5-thinking', name: 'GPT-5 Thinking', description: 'Deep analytical and multi-step synthesis', speed: 'Deliberate', context: '1M', icon: 'Cpu' },
  { id: 'claude-sonnet', name: 'Claude 3.5 Sonnet', description: 'Elite balance of coding and intelligence', speed: 'Fast', context: '200k', icon: 'Layers' },
  { id: 'gemini-2-5-pro', name: 'Gemini 2.5 Pro', description: 'Native multimodal reasoning powerhouse', speed: 'Fast', context: '2M', icon: 'Cpu' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', description: 'Advanced open architecture generalist', speed: 'Fast', context: '64k', icon: 'Cpu' },
];

interface ModelSelectorProps {
  selectedModel: ModelOption;
  onSelectModel: (model: ModelOption) => void;
}

export default function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap size={14} className="text-amber-400" />;
      case 'Layers':
        return <Layers size={14} className="text-indigo-400" />;
      case 'Sparkles':
        return <Sparkles size={14} className="text-purple-400" />;
      default:
        return <Cpu size={14} className="text-emerald-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700/80 rounded-full text-xs font-semibold text-zinc-200 transition-all shadow-md backdrop-blur-md group"
      >
        <div className="flex items-center justify-center p-1 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
          {getModelIcon(selectedModel.icon)}
        </div>
        <span className="truncate max-w-[130px] sm:max-w-none">{selectedModel.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
          {selectedModel.speed || 'Fast'}
        </span>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-zinc-200' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-84 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl divide-y divide-zinc-800/50"
          >
            <div className="p-3 bg-zinc-900/50 flex items-center justify-between text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              <span>Select AI Engine</span>
              <span className="text-[10px] text-zinc-500 font-normal">7 Models Available</span>
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
              {MODELS.map((model) => {
                const isSelected = selectedModel.id === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between group ${
                      isSelected
                        ? 'bg-zinc-900 border border-indigo-500/30 shadow-inner'
                        : 'hover:bg-zinc-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200'}`}>
                        {getModelIcon(model.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                            {model.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
                            {model.context}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 group-hover:text-zinc-300">{model.description}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400 mt-1 shrink-0">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
