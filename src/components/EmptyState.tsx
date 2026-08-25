'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code2, PenLine, ImagePlus, BookOpen, Lightbulb, MessageSquare } from 'lucide-react';
import OryxLogo from './OryxLogo';

interface EmptyStateProps {
  onSelectSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  {
    icon: Code2,
    label: 'Build a landing page',
    prompt: 'Build me a modern, responsive SaaS landing page with hero section, features, pricing and footer',
  },
  {
    icon: Lightbulb,
    label: 'Brainstorm ideas',
    prompt: 'Brainstorm 10 creative startup ideas for 2026 and pick the best one with reasons',
  },
  {
    icon: ImagePlus,
    label: 'Generate an image',
    prompt: 'Generate image of a futuristic city skyline at sunset with neon lights',
  },
  {
    icon: PenLine,
    label: 'Write code',
    prompt: 'Write a Python script that renames all files in a folder with a numbered prefix',
  },
  {
    icon: BookOpen,
    label: 'Explain a concept',
    prompt: 'Explain how HTTPS works in simple terms with a fun analogy',
  },
  {
    icon: MessageSquare,
    label: 'Chat with me',
    prompt: 'Give me a warm greeting and tell me what you can help me build today',
  },
];

export default function EmptyState({ onSelectSuggestion }: EmptyStateProps) {
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Working late?' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 select-none">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative flex items-center justify-center mb-6"
      >
        <div className="absolute w-32 h-32 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-ambient" />
        <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/10">
          <OryxLogo size={58} />
        </div>
      </motion.div>

      {/* Greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="text-2xl md:text-3xl font-semibold tracking-tight text-[#ececec] mb-2"
      >
        <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
          {greeting}
        </span>
        {' — what can I help with?'}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
        className="text-sm text-[#afafaf] mb-8 max-w-md text-center"
      >
        Ask anything, or pick a starter below — Oryx AI can chat, code, and build full websites.
      </motion.p>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-2xl"
      >
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelectSuggestion(s.prompt)}
            className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-left transition-all hover:-translate-y-0.5"
          >
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-300 group-hover:bg-indigo-500/25 transition-colors shrink-0">
              <s.icon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#ececec]">{s.label}</div>
              <div className="text-[11px] text-[#8f8f8f] truncate">{s.prompt}</div>
            </div>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
