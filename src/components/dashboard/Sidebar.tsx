'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '@/types/chat';
import OryxLogo from '../OryxLogo';
import {
  Plus,
  MessageSquare,
  Pin,
  FolderKanban,
  MoreHorizontal,
  Archive,
  Trash2,
  Edit2,
  Share2,
  FolderInput,
  LogOut,
  X,
  Search,
  PanelLeftClose,
  Settings,
  ChevronDown,
  ArchiveRestore,
  Brain,
  Smartphone,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  modifiedDate: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  sessions?: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onTogglePin?: (id: string) => void;
  pinnedIds?: string[];
  onMoveToProject?: (sessionId: string, projectId: string) => void;
  onArchiveSession?: (sessionId: string) => void;
  archivedIds?: string[];
  onUnarchiveSession?: (sessionId: string) => void;
  currentView: 'chat' | 'projects' | 'cloudbrain' | 'getapp';
  onSwitchView?: (view: 'chat' | 'projects') => void;
  onSelectProject?: (projectId: string) => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  showNewProjectModal: boolean;
  setShowNewProjectModal: (show: boolean) => void;
  newProjName: string;
  setNewProjName: (name: string) => void;
  newProjDesc: string;
  setNewProjDesc: (desc: string) => void;
  settingsProject: Project | null;
  setSettingsProject: (proj: Project | null) => void;
  settingsName: string;
  setSettingsName: (name: string) => void;
  settingsDesc: string;
  setSettingsDesc: (desc: string) => void;
  onCreateProject: () => void;
  onUpdateProject: () => void;
  onDeleteProject: (id: string) => void;
  triggerToast: (msg: string) => void;
  confirmConfig: any;
  setConfirmConfig: (config: any) => void;
  onLogout?: () => void;
  user?: any;
  onOpenSettings?: () => void;
  onOpenSearch?: () => void;
  onOpenCloudBrain?: () => void;
  onOpenGetApp?: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onTogglePin,
  pinnedIds = [],
  onMoveToProject,
  onArchiveSession,
  archivedIds = [],
  onUnarchiveSession,
  currentView,
  onSwitchView,
  onSelectProject,
  projects,
  setProjects,
  showNewProjectModal,
  setShowNewProjectModal,
  newProjName,
  setNewProjName,
  newProjDesc,
  setNewProjDesc,
  settingsProject,
  setSettingsProject,
  settingsName,
  setSettingsName,
  settingsDesc,
  setSettingsDesc,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  triggerToast,
  confirmConfig,
  setConfirmConfig,
  onLogout,
  user,
  onOpenSettings,
  onOpenSearch,
  onOpenCloudBrain,
  onOpenGetApp,
}: SidebarProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = (session: ChatSession) => {
    setRenamingId(session.id);
    setRenameValue(session.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (renameValue.trim() && onRenameSession) {
      onRenameSession(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const activeSessions = sessions.filter((s) => !archivedIds.includes(s.id));
  const pinnedSessions = activeSessions.filter((s) => pinnedIds.includes(s.id));
  const recentSessions = activeSessions.filter((s) => !pinnedIds.includes(s.id));
  const archivedSessions = sessions.filter((s) => archivedIds.includes(s.id));

  const renderChatItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId && currentView === 'chat';
    const isPinned = pinnedIds.includes(session.id);
    const isMenuOpen = activeMenuId === session.id;
    const isRenaming = renamingId === session.id;

    if (isRenaming) {
      return (
        <div key={session.id} className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="w-full bg-zinc-800 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/40"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename(session.id);
              if (e.key === 'Escape') setRenamingId(null);
            }}
            onBlur={() => handleSaveRename(session.id)}
          />
        </div>
      );
    }

    return (
      <div
        key={session.id}
        onClick={() => {
          if (onSwitchView) onSwitchView('chat');
          onSelectSession(session.id);
        }}
        className={`group relative flex items-center rounded-lg cursor-pointer text-xs transition-colors ${
          isActive
            ? 'bg-[#2f2f2f] text-white'
            : 'text-[#afafaf] hover:bg-[#2f2f2f]/70 hover:text-[#ececec]'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 px-2.5 py-2">
          {isPinned && <Pin size={11} className="fill-amber-400 text-amber-400 shrink-0" />}
          <span className="truncate">{session.title}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuId(isMenuOpen ? null : session.id);
          }}
          className={`p-1.5 mr-1 rounded-md hover:bg-white/10 text-[#afafaf] hover:text-white transition-all ${
            isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <MoreHorizontal size={14} />
        </button>

        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 top-9 w-48 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl py-1 z-50 text-[11px] text-[#ececec]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}/chat/share/${session.id}`;
                navigator.clipboard.writeText(shareUrl);
                triggerToast('Shareable link copied!');
                setActiveMenuId(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <Share2 size={13} className="text-[#afafaf]" /> Share
            </button>
            <button
              onClick={() => handleStartRename(session)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <Edit2 size={13} className="text-[#afafaf]" /> Rename
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  if (!projects.length) {
                    setShowNewProjectModal(true);
                    setActiveMenuId(null);
                    return;
                  }
                  const idx = projects.findIndex((p) => p.id === session.projectId);
                  const next = projects[(idx + 1) % projects.length];
                  if (onMoveToProject) onMoveToProject(session.id, next.id);
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
              >
                <FolderInput size={13} className="text-[#afafaf]" /> Move to project
                {projects.length > 0 && (
                  <span className="ml-auto text-[10px] text-[#777] truncate max-w-[60px]">
                    {projects.find((p) => p.id === session.projectId)?.name || '—'}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={() => {
                if (onTogglePin) onTogglePin(session.id);
                setActiveMenuId(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <Pin size={13} className={isPinned ? 'fill-amber-400 text-amber-400' : 'text-[#afafaf]'} />
              {isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => {
                if (onArchiveSession) {
                  onArchiveSession(session.id);
                  triggerToast('Archived');
                }
                setActiveMenuId(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <Archive size={13} className="text-[#afafaf]" /> Archive
            </button>
            <div className="border-t border-white/10 my-1" />
            <button
              onClick={() => {
                setConfirmConfig({
                  isOpen: true,
                  title: 'Delete Chat',
                  message: 'Are you sure you want to delete this chat? This action cannot be undone.',
                  onConfirm: () => {
                    onDeleteSession(session.id);
                    triggerToast('Chat deleted');
                    setConfirmConfig(null);
                  },
                });
                setActiveMenuId(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  // ---- Closed Sidebar ----
  if (!isOpen) {
    return (
      <aside className="w-[60px] bg-[#171717] border-r border-white/5 flex flex-col items-center justify-between py-3 select-none h-screen shrink-0 z-30">
        <div className="flex flex-col items-center gap-1.5 w-full px-2">
          <button
            onClick={onToggle}
            title="Open Sidebar"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors"
          >
            <OryxLogo size={22} />
          </button>
          <button
            onClick={() => {
              if (onSwitchView) onSwitchView('chat');
              onNewChat();
            }}
            title="New Chat"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus size={19} />
          </button>
          <button
            onClick={() => onOpenSearch && onOpenSearch()}
            title="Search (⌘K)"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors"
          >
            <Search size={17} />
          </button>
          <button
            onClick={() => onOpenCloudBrain && onOpenCloudBrain()}
            title="Cloud Brain"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              currentView === 'cloudbrain'
                ? 'text-[#D97757] bg-[#D97757]/15'
                : 'text-[#afafaf] hover:text-white hover:bg-white/10'
            }`}
          >
            <Brain size={17} />
          </button>
          <button
            onClick={() => onOpenGetApp && onOpenGetApp()}
            title="Get the App"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              currentView === 'getapp'
                ? 'text-indigo-300 bg-indigo-500/15'
                : 'text-[#afafaf] hover:text-white hover:bg-white/10'
            }`}
          >
            <Smartphone size={17} />
          </button>
          <button
            onClick={() => onSwitchView && onSwitchView('projects')}
            title="Projects"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors"
          >
            <FolderKanban size={17} />
          </button>
        </div>

        <div className="w-full px-2 flex flex-col items-center gap-2">
          {user && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-semibold flex items-center justify-center text-xs">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Logout"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#afafaf] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    );
  }

  // ---- Open Sidebar ----
  return (
    <>
      <aside className="w-[260px] bg-[#171717] border-r border-white/5 flex flex-col h-screen select-none shrink-0 z-30">
        {/* Header */}
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 px-1">
            <OryxLogo size={24} />
            <span className="text-sm font-semibold text-[#ececec] tracking-tight">Oryx AI</span>
          </div>
          <button
            onClick={onToggle}
            title="Collapse Sidebar"
            className="p-1.5 rounded-lg text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Primary actions */}
        <div className="px-3 py-2 space-y-0.5">
          <button
            onClick={() => {
              if (onSwitchView) onSwitchView('chat');
              onNewChat();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
          >
            <Plus size={16} className="text-[#afafaf]" />
            <span>New chat</span>
          </button>
          <button
            onClick={() => onOpenSearch && onOpenSearch()}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
          >
            <Search size={16} className="text-[#afafaf]" />
            <span>Search chats</span>
            <span className="ml-auto text-[10px] font-mono text-[#777]">⌘K</span>
          </button>
          <button
            onClick={() => onOpenCloudBrain && onOpenCloudBrain()}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'cloudbrain'
                ? 'bg-[#D97757]/15 text-[#D97757]'
                : 'text-[#ececec] hover:bg-[#2f2f2f]'
            }`}
          >
            <Brain size={16} className={currentView === 'cloudbrain' ? 'text-[#D97757]' : 'text-[#afafaf]'} />
            <span>Cloud Brain</span>
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#D97757]/15 text-[#D97757] border border-[#D97757]/25">AI</span>
          </button>
          <button
            onClick={() => onOpenGetApp && onOpenGetApp()}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'getapp'
                ? 'bg-indigo-500/15 text-indigo-300'
                : 'text-[#ececec] hover:bg-[#2f2f2f]'
            }`}
          >
            <Smartphone size={16} className={currentView === 'getapp' ? 'text-indigo-300' : 'text-[#afafaf]'} />
            <span>Get the App</span>
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">NEW</span>
          </button>
        </div>

        {/* Chats + Projects */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
          {pinnedSessions.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-[#8f8f8f] px-2.5 mb-1 flex items-center gap-1.5">
                <Pin size={10} className="fill-amber-400 text-amber-400" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5">{pinnedSessions.map(renderChatItem)}</div>
            </div>
          )}

          <div>
            <div className="text-[11px] font-medium text-[#8f8f8f] px-2.5 mb-1">Chats</div>
            <div className="space-y-0.5">
              {recentSessions.length === 0 ? (
                <div className="px-2.5 py-2 text-[11px] text-[#777]">No conversations yet</div>
              ) : (
                recentSessions.map(renderChatItem)
              )}
            </div>
          </div>

          {/* Projects */}
          <div>
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="w-full flex items-center gap-1.5 text-[11px] font-medium text-[#8f8f8f] px-2.5 mb-1 hover:text-[#ececec] transition-colors"
            >
              <ChevronDown
                size={12}
                className={`transition-transform ${projectsExpanded ? '' : '-rotate-90'}`}
              />
              <span>Projects</span>
              <span className="text-[#777]">({projects.length})</span>
            </button>
            {projectsExpanded && (
              <div className="space-y-0.5">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      if (onSelectProject) onSelectProject(proj.id);
                      else if (onSwitchView) onSwitchView('projects');
                    }}
                    title={proj.description}
                    className={`group flex items-center rounded-lg cursor-pointer text-xs transition-colors hover:bg-[#2f2f2f]/70 hover:text-[#ececec] ${
                      currentView === 'projects' ? 'text-[#ececec]' : 'text-[#afafaf]'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 px-2.5 py-2">
                      <FolderKanban size={13} className="shrink-0 opacity-70" />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettingsProject(proj);
                        setSettingsName(proj.name);
                        setSettingsDesc(proj.description);
                      }}
                      className="p-1.5 mr-1 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Settings size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-[#afafaf] hover:bg-[#2f2f2f]/70 hover:text-[#ececec] transition-colors"
                >
                  <Plus size={13} />
                  <span>New project</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Archived */}
        {archivedSessions.length > 0 && (
          <div className="px-3 py-1.5">
            <button
              onClick={() => setShowArchivedModal(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-[#afafaf] hover:bg-[#2f2f2f] hover:text-[#ececec] transition-colors"
            >
              <Archive size={15} />
              <span>Archived</span>
              <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{archivedSessions.length}</span>
            </button>
          </div>
        )}

        {/* User Footer */}
        <div className="p-2 border-t border-white/5 relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-semibold flex items-center justify-center text-[11px] shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-medium text-[#ececec] truncate">{user?.email || 'User'}</div>
            </div>
            <MoreHorizontal size={15} className="text-[#afafaf] shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-14 left-2 right-2 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl py-1 z-50 text-xs text-[#ececec]">
              <button
                onClick={() => {
                  if (onOpenSettings) onOpenSettings();
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
              >
                <Settings size={14} className="text-[#afafaf]" /> Settings
              </button>
              {onLogout && (
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-500/10 text-red-400 transition-colors"
                >
                  <LogOut size={14} /> Log out
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Archived Chats Modal */}
      {showArchivedModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#2a2a2a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#ececec]">
                <Archive size={16} className="text-indigo-400" />
                <span>Archived Chats</span>
              </div>
              <button
                onClick={() => setShowArchivedModal(false)}
                className="p-1 rounded-lg text-[#afafaf] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {archivedSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs"
                >
                  <span className="truncate text-[#ececec] font-medium max-w-[220px]">{session.title}</span>
                  <button
                    onClick={() => {
                      if (onUnarchiveSession) onUnarchiveSession(session.id);
                      triggerToast('Unarchived');
                    }}
                    className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-lg text-[11px] font-semibold transition-colors border border-indigo-500/30 flex items-center gap-1.5"
                  >
                    <ArchiveRestore size={12} /> Unarchive
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
