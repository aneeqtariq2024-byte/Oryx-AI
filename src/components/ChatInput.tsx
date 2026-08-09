'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUp, Mic, Globe } from 'lucide-react';
import PlusMenu from './PlusMenu';
import { PlusMenuItem } from '@/types/chat';

interface ChatInputProps {
  prompt: string;
  setPrompt: (val: string) => void;
  onSend: () => void;
}

export default function ChatInput({ prompt, setPrompt, onSend }: ChatInputProps) {
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        onSend();
      }
    }
  };

  const handleSelectPlusItem = (item: PlusMenuItem) => {
    setPrompt(`[${item.title}] ${prompt}`);
  };

  return (
    <div className="p-3 md:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent z-20 sticky bottom-0">
      <div className="max-w-3xl mx-auto relative">
        <div className="relative bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-2.5 shadow-2xl flex items-end gap-2.5 transition-all duration-200 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 backdrop-blur-xl">
          <div className="relative">
            <button
              onClick={() => setIsPlusOpen(!isPlusOpen)}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 text-zinc-400 hover:text-zinc-100 transition-all duration-200"
              title="Add Capabilities"
            >
              <Plus size={18} className={`transition-transform duration-200 ${isPlusOpen ? 'rotate-45 text-indigo-400' : ''}`} />
            </button>
            <PlusMenu
              isOpen={isPlusOpen}
              onClose={() => setIsPlusOpen(false)}
              onSelect={handleSelectPlusItem}
            />
          </div>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything or build a app..."
            rows={1}
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none py-2 px-1 max-h-[180px] leading-relaxed custom-scrollbar font-normal"
          />

          <AnimatePresence>
            {prompt.trim().length > 0 ? (
              <motion.button
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={onSend}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 mb-0.5"
                title="Send Message"
              >
                <ArrowUp size={18} className="stroke-[2.5]" />
              </motion.button>
            ) : (
              <div className="flex items-center gap-1.5 p-1 mb-0.5 text-zinc-500">
                <button
                  className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                  title="Voice input"
                >
                  <Mic size={17} />
                </button>
                <button
                  className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                  title="Web Search Context"
                >
                  <Globe size={17} />
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer text centered - removed "Press Enter to send" as requested */}
        <div className="text-center mt-2.5 text-[11px] font-medium text-zinc-500 select-none">
          Oryx AI Powered by Ryzen Engine
        </div>
      </div>
    </div>
  );
}