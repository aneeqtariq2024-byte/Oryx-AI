'use client';

import React, { useState, useRef, useEffect } from 'react';
import ModelSelector from './ModelSelector';
import { ModelOption } from '@/types/chat';
import { Edit2, Check, Search, PanelLeftOpen, Share2, Download } from 'lucide-react';

interface HeaderProps {
  title: string;
  selectedModel: ModelOption;
  onSelectModel: (model: ModelOption) => void;
  onRenameTitle?: (newTitle: string) => void;
  onOpenSearch?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onExportChat?: () => void;
}

export default function Header({
  title,
  selectedModel,
  onSelectModel,
  onRenameTitle,
  onOpenSearch,
  isSidebarOpen,
  onToggleSidebar,
  onExportChat,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setEditValue(title || ''), [title]);

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
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(title || '');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <header className="h-14 bg-[#212121] px-3 md:px-5 flex items-center justify-between z-20 sticky top-0 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {!isSidebarOpen && onToggleSidebar && (
          <>
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors"
              title="Open Sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-lg text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors"
              title="Search chats (⌘K)"
            >
              <Search size={17} />
            </button>
          </>
        )}

        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="bg-[#303030] border border-white/25 rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:outline-none"
            />
            <button
              onClick={handleSave}
              className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Save"
            >
              <Check size={15} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="group flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 -ml-1.5 rounded-lg hover:bg-white/5 transition-colors min-w-0"
            title="Click to rename"
          >
            <h1 className="text-sm font-medium text-[#ececec] tracking-tight truncate max-w-[40vw] sm:max-w-md">
              {title || 'New chat'}
            </h1>
            <Edit2 size={12} className="text-[#777] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {onExportChat && (
          <button
            onClick={onExportChat}
            className="p-2 rounded-lg text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-medium"
            title="Export chat as Markdown"
          >
            <Download size={15} />
          </button>
        )}
        <button
          onClick={handleShare}
          className="p-2 rounded-lg text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-medium"
          title="Copy link"
        >
          <Share2 size={15} />
        </button>
        <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
      </div>
    </header>
  );
}
