'use client';

import React, { useState, useRef, useEffect } from 'react';
import ModelSelector from './ModelSelector';
import OryxLogo from './OryxLogo';
import { ModelOption } from '@/types/chat';
import { Edit2, Check, Search, PanelLeftOpen } from 'lucide-react';

interface HeaderProps {
  title: string;
  selectedModel: ModelOption;
  onSelectModel: (model: ModelOption) => void;
  onRenameTitle?: (newTitle: string) => void;
  onOpenSearch?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({
  title,
  selectedModel,
  onSelectModel,
  onRenameTitle,
  onOpenSearch,
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(title || '');
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue.trim() && onRenameTitle && editValue !== title) {
      onRenameTitle(editValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(title || '');
    }
  };

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center gap-3">
        {/* Toggle sidebar button if sidebar is closed */}
        {!isSidebarOpen && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all mr-1 shadow-sm"
            title="Open Sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        {/* Search button if sidebar is closed */}
        {!isSidebarOpen && onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all mr-2 shadow-sm flex items-center gap-1.5 text-xs"
            title="Search chats (⌘K)"
          >
            <Search size={15} />
            <span className="hidden sm:inline text-zinc-500 font-mono text-[10px]">⌘K</span>
          </button>
        )}

        {/* Editable Title */}
        <div className="flex items-center gap-2.5">
          <OryxLogo size={22} />
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="bg-zinc-900 border border-indigo-500/50 rounded-lg px-2 py-0.5 text-xs md:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                onClick={handleSave}
                className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                title="Save Title"
              >
                <Check size={15} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="group flex items-center gap-1.5 cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800 transition-all"
              title="Click to rename conversation"
            >
              <h1 className="text-xs md:text-sm font-semibold text-zinc-200 tracking-tight truncate max-w-xs sm:max-w-md group-hover:text-white">
                {title || 'New Workspace Chat'}
              </h1>
              <Edit2 size={13} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
      </div>
    </header>
  );
}
