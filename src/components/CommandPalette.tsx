'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MessageSquare, X, FolderKanban, Brain, Download } from 'lucide-react';
import { ChatSession, ChatMessage } from '@/types/chat';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  messagesMap?: Record<string, ChatMessage[]>;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onSwitchView?: (view: 'chat' | 'projects') => void;
  onOpenCloudBrain?: () => void;
  onExportChat?: () => void;
}

interface MessageHit {
  session: ChatSession;
  snippet: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
  sessions,
  messagesMap,
  onSelectSession,
  onNewChat,
  onSwitchView,
  onOpenCloudBrain,
  onExportChat,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) setSearchQuery('');
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const q = searchQuery.toLowerCase().trim();

  // Full-text search: matches chat titles AND message contents, with a snippet of the hit
  const { titleHits, messageHits } = useMemo(() => {
    if (!q) return { titleHits: sessions.slice(0, 7), messageHits: [] as MessageHit[] };
    const titles = sessions.filter((s) => s.title.toLowerCase().includes(q)).slice(0, 5);
    const hits: MessageHit[] = [];
    for (const session of sessions) {
      const msgs = messagesMap?.[session.id];
      if (!msgs) continue;
      for (const m of msgs) {
        const content = m.content || '';
        const idx = content.toLowerCase().indexOf(q);
        if (idx !== -1) {
          const start = Math.max(0, idx - 30);
          const snippet =
            (start > 0 ? '…' : '') + content.slice(start, idx + q.length + 60).replace(/\n/g, ' ') + '…';
          hits.push({ session, snippet });
          break; // one hit per session is enough
        }
      }
      if (hits.length >= 5) break;
    }
    return { titleHits: titles, messageHits: hits };
  }, [q, sessions, messagesMap]);

  const showCommands = !q;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-24 p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="bg-zinc-950 border border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden divide-y divide-zinc-800/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-zinc-900/50 flex items-center gap-3 px-4">
              <Search size={18} className="text-zinc-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats & messages... (Ctrl + K)"
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
              {showCommands && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Quick Actions</div>

                  <button
                    onClick={() => {
                      onNewChat();
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 flex items-center gap-2.5 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Plus size={14} />
                    </div>
                    <span>Start New Conversation</span>
                  </button>

                  {onOpenCloudBrain && (
                    <button
                      onClick={() => {
                        onOpenCloudBrain();
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 flex items-center gap-2.5 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <Brain size={14} />
                      </div>
                      <span>Open Cloud Brain (API Keys)</span>
                    </button>
                  )}

                  {onSwitchView && (
                    <button
                      onClick={() => {
                        onSwitchView('projects');
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 flex items-center gap-2.5 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <FolderKanban size={14} />
                      </div>
                      <span>Open Projects Workspace</span>
                    </button>
                  )}

                  {onExportChat && (
                    <button
                      onClick={() => {
                        onExportChat();
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 flex items-center gap-2.5 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Download size={14} />
                      </div>
                      <span>Export Current Chat (.md)</span>
                    </button>
                  )}
                </>
              )}

              {titleHits.length > 0 && (
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2">
                  {q ? 'Matching Chats' : 'Recent Conversations'}
                </div>
              )}

              {titleHits.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs text-zinc-300 hover:text-zinc-100 flex items-center gap-2.5 transition-colors"
                >
                  <MessageSquare size={14} className="text-zinc-500 shrink-0" />
                  <span className="truncate">{session.title}</span>
                </button>
              ))}

              {messageHits.length > 0 && (
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2">Message Matches</div>
              )}

              {messageHits.map((hit, i) => (
                <button
                  key={`${hit.session.id}-${i}`}
                  onClick={() => {
                    onSelectSession(hit.session.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <MessageSquare size={13} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{hit.session.title}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed pl-[22px]">{hit.snippet}</p>
                </button>
              ))}

              {q && titleHits.length === 0 && messageHits.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">No results for &ldquo;{searchQuery}&rdquo;</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
