'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Image as ImageIcon, Microscope, MessageSquare, FileText, Code2, BarChart3, Video, Mic, FolderUp } from 'lucide-react';
import { PlusMenuItem } from '@/types/chat';

const MENU_ITEMS: PlusMenuItem[] = [
  { id: 'website', icon: 'Globe', title: 'Website', description: 'Generate complete web applications' },
  { id: 'research', icon: 'Microscope', title: 'Deep Research', description: 'Lightning analytical research via Groq' },
  { id: 'chat', icon: 'MessageSquare', title: 'Chat', description: 'Normal conversational flow' },
  { id: 'code', icon: 'Code2', title: 'Code', description: 'Advanced programming & scripts' },
  { id: 'data', icon: 'BarChart3', title: 'Data Analysis', description: 'CSV, Excel & JSON modeling' },
  { id: 'upload', icon: 'FolderUp', title: 'Upload Files', description: 'PDF, Word, Excel, Images & Zips' },
];

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe size={16} className="text-indigo-400" />,
  ImageIcon: <ImageIcon size={16} className="text-purple-400" />,
  Microscope: <Microscope size={16} className="text-emerald-400" />,
  MessageSquare: <MessageSquare size={16} className="text-blue-400" />,
  FileText: <FileText size={16} className="text-amber-400" />,
  Code2: <Code2 size={16} className="text-cyan-400" />,
  BarChart3: <BarChart3 size={16} className="text-pink-400" />,
  Video: <Video size={16} className="text-red-400" />,
  Mic: <Mic size={16} className="text-teal-400" />,
  FolderUp: <FolderUp size={16} className="text-orange-400" />,
};

interface PlusMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: PlusMenuItem) => void;
}

export default function PlusMenu({ isOpen, onClose, onSelect }: PlusMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute bottom-16 left-0 w-80 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl divide-y divide-zinc-800/50"
        >
          <div className="p-3 bg-zinc-900/50 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
            Workspace Tools & Extensions
          </div>
          <div className="max-h-96 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-900/80 transition-all flex items-center gap-3 group border border-transparent hover:border-zinc-800"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-colors shrink-0">
                  {iconMap[item.icon]}
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-1">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
