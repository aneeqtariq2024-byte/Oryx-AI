'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onSelectSuggestion: (text: string) => void;
}

export default function EmptyState({ onSelectSuggestion }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] px-4 text-center select-none">
      {/* Animated Glowing AI Logo Orb */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex items-center justify-center mb-8"
      >
        {/* Ambient glow rings */}
        <div className="absolute w-36 h-36 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-ambient" />
        <div className="absolute w-24 h-24 bg-purple-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />

        {/* Main logo icon */}
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/40 flex items-center justify-center shadow-2xl shadow-indigo-500/30 group">
          <Sparkles className="w-9 h-9 text-white" />
        </div>
      </motion.div>

      {/* Main Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight"
      >
        What can I help you{' '}
        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
          build today?
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18 }}
        className="text-zinc-400 text-base md:text-lg max-w-lg font-medium leading-relaxed"
      >
        Powered by Oryx AI Neural Engine and high-speed workspace intelligence.
      </motion.p>
    </div>
  );
}
