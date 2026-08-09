'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Pin, PanelLeftClose, PanelLeftOpen, Search, Settings, Trash2 } from 'lucide-react';
import { ChatSession } from '@/types/chat';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const pinnedSessions = sessions.filter((s) => s.pinned);
  const recentSessions = sessions.filter((s) => !s.pinned);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? '280px' : '0px', opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="h-screen bg-[#111111] border-r border-[rgba(255,255,255,0.08)] flex flex-col justify-between overflow-hidden z-30 select-none relative"
      >
        <div className="w-[280px] h-full flex flex-col p-4 justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#171717] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#E8D8B8] font-bold text-sm">
                  Ω
                </div>
                <span className="font-semibold text-sm tracking-wide text-white">Oryx AI</span>
              </div>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-[#B5B5B5] hover:text-white hover:bg-[#171717] transition-colors"
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            <button
              onClick={onNewChat}
              className="w-full py-2.5 px-4 bg-[#171717] hover:bg-[#202020] border border-[rgba(255,255,255,0.08)] rounded-xl font-medium text-xs text-white flex items-center justify-between transition-all shadow-sm group mb-4"
            >
              <span className="flex items-center gap-2">
                <Plus size={16} className="text-[#E8D8B8]" /> New Conversation
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[#B5B5B5]">⌘K</span>
            </button>

            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-2.5 text-[#B5B5B5]" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#171717] border border-[rgba(255,255,255,0.08)] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#B5B5B5] focus:outline-none focus:border-[#E8D8B8] transition-colors"
              />
            </div>

            <div className="space-y-4 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
              {pinnedSessions.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-[#B5B5B5] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                    <Pin size={12} className="text-[#E8D8B8]" /> Pinned Chats
                  </div>
                  <div className="space-y-1">
                    {pinnedSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isActive={session.id === activeSessionId}
                        onSelect={() => onSelectSession(session.id)}
                        onDelete={() => onDeleteSession(session.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] font-semibold text-[#B5B5B5] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare size={12} /> Recent History
                </div>
                <div className="space-y-1">
                  {recentSessions
                    .filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isActive={session.id === activeSessionId}
                        onSelect={() => onSelectSession(session.id)}
                        onDelete={() => onDeleteSession(session.id)}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#171717] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-xs font-semibold text-[#E8D8B8]">
                AT
              </div>
              <div>
                <div className="text-xs font-medium text-white">Aneeq Tariq</div>
                <div className="text-[10px] text-[#B5B5B5]">Groq Enterprise Plan</div>
              </div>
            </div>
            <button className="p-2 rounded-lg text-[#B5B5B5] hover:text-white hover:bg-[#171717] transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </motion.aside>

      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute top-4 left-4 z-40 p-2 bg-[#111111] hover:bg-[#171717] border border-[rgba(255,255,255,0.08)] rounded-xl text-[#B5B5B5] hover:text-white shadow-xl transition-all"
          title="Open Sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}
    </>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
        isActive
          ? 'bg-[#171717] text-[#E8D8B8] border border-[rgba(232,216,184,0.15)] shadow-sm'
          : 'text-[#B5B5B5] hover:bg-[#171717]/60 hover:text-white'
      }`}
    >
      <span className="truncate pr-6">{session.title}</span>
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 p-1 text-[#B5B5B5] hover:text-[#D67A7A] transition-colors"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}