'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MessageSquare, X, FolderKanban, Sparkles } from 'lucide-react';
import { ChatSession } from '@/types/chat';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onSwitchView?: (view: 'chat' | 'projects') => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onNewChat,
  onSwitchView,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-24 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="bg-zinc-950 border border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden divide-y divide-zinc-800/60"
          >
            <div className="p-3 bg-zinc-900/50 flex items-center gap-3 px-4">
              <Search size={18} className="text-zinc-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a command or search conversations... (Ctrl + K)"
                className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-medium"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1 custom-scrollbar">
              <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Quick Actions
              </div>

              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 flex items-center gap-2.5 transition-colors group"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Plus size={14} />
                </div>
                <span>Start New Conversation</span>
              </button>

              {onSwitchView && (
                <button
                  onClick={() => {
                    onSwitchView('projects');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 flex items-center gap-2.5 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <FolderKanban size={14} />
                  </div>
                  <span>Open Projects Workspace</span>
                </button>
              )}

              <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2">
                Recent Conversations
              </div>

              {filteredSessions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-zinc-500">No matching conversations</div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs text-zinc-300 hover:text-zinc-100 flex items-center gap-2.5 transition-colors"
                  >
                    <MessageSquare size={14} className="text-zinc-500" />
                    <span className="truncate">{session.title}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}