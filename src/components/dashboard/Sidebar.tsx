'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '@/types/chat';
import OryxLogo from '../OryxLogo';
import {
  Plus,
  MessageSquare,
  Pin,
  FolderKanban,
  MoreVertical,
  Archive,
  Trash2,
  Edit2,
  Share2,
  FolderInput,
  LogOut,
  X,
  Search,
  ChevronLeft,
  Settings,
  HelpCircle,
  Download,
  MoreHorizontal,
  Sparkles,
  Check,
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
  currentView: 'chat' | 'projects';
  onSwitchView?: (view: 'chat' | 'projects') => void;
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
}: SidebarProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [moveProjectMenuId, setMoveProjectMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // User menu dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
        setMoveProjectMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCurrentPinned = pinnedIds.includes(activeSessionId);

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

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSessions = filteredSessions.filter((s) => !archivedIds.includes(s.id));
  const pinnedSessions = activeSessions.filter((s) => pinnedIds.includes(s.id));
  const recentSessions = activeSessions.filter((s) => !pinnedIds.includes(s.id));
  const archivedSessions = sessions.filter((s) => archivedIds.includes(s.id));

  const renderChatItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId && currentView === 'chat';
    const isPinned = pinnedIds.includes(session.id);
    const isMenuOpen = activeMenuId === session.id;
    const isRenaming = renamingId === session.id;
    const isMovingProject = moveProjectMenuId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => {
          if (!isRenaming) {
            if (onSwitchView) onSwitchView('chat');
            onSelectSession(session.id);
          }
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-all ${
          isActive
            ? 'bg-zinc-800/90 text-white font-medium border border-zinc-700/80 shadow-md'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
        }`}
      >
        {isRenaming ? (
          <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full bg-zinc-950 border border-indigo-500/50 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(session.id);
                if (e.key === 'Escape') setRenamingId(null);
              }}
            />
            <button
              onClick={() => handleSaveRename(session.id)}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition-colors"
            >
              Save
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 truncate pr-6">
              <MessageSquare
                size={14}
                className={isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}
              />
              <span className="truncate">{session.title}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : session.id);
                setMoveProjectMenuId(null);
              }}
              className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-white text-zinc-400 transition-opacity rounded-md hover:bg-zinc-800"
            >
              <MoreVertical size={13} />
            </button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-8 w-52 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 text-[11px] text-zinc-300 backdrop-blur-2xl divide-y divide-zinc-800/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/chat/share/${session.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      triggerToast('Shareable link copied!');
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 transition-colors"
                  >
                    <Share2 size={13} className="text-zinc-400" /> Share
                  </button>
                  <button
                    onClick={() => handleStartRename(session)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 transition-colors"
                  >
                    <Edit2 size={13} className="text-zinc-400" /> Rename
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setMoveProjectMenuId(isMovingProject ? null : session.id)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FolderInput size={13} className="text-zinc-400" /> Move to project
                      </div>
                      <span className="text-[10px] text-zinc-500">▸</span>
                    </button>
                    {isMovingProject && (
                      <div className="absolute right-full top-0 mr-1 w-52 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 divide-y divide-zinc-800/50">
                        <div className="py-1 max-h-40 overflow-y-auto custom-scrollbar">
                          {projects.length === 0 ? (
                            <div className="px-3 py-2 text-[11px] text-zinc-500 italic">No projects created yet</div>
                          ) : (
                            projects.map((proj) => (
                              <button
                                key={proj.id}
                                onClick={() => {
                                  if (onMoveToProject) onMoveToProject(session.id, proj.id);
                                  triggerToast(`Moved to "${proj.name}"`);
                                  setActiveMenuId(null);
                                  setMoveProjectMenuId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-900 truncate text-zinc-300 flex items-center gap-2"
                              >
                                <FolderKanban size={13} className="text-indigo-400 shrink-0" />
                                <span className="truncate">{proj.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setMoveProjectMenuId(null);
                              setShowNewProjectModal(true);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-600/10 text-indigo-400 font-semibold flex items-center gap-2 transition-colors"
                          >
                            <Plus size={13} />
                            <span>Create New Project</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      if (onTogglePin) onTogglePin(session.id);
                      triggerToast(isPinned ? 'Unpinned' : 'Pinned');
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 transition-colors"
                  >
                    <Pin size={13} className={isPinned ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'} />
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
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 transition-colors"
                  >
                    <Archive size={13} className="text-zinc-400" /> Archive
                  </button>
                </div>

                <div className="py-1">
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
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ---- Closed Sidebar ----
  if (!isOpen) {
    return (
      <aside className="w-16 bg-zinc-950 border-r border-zinc-800/80 flex flex-col items-center justify-between py-4 select-none h-screen shrink-0 z-30">
        <div className="flex flex-col items-center gap-3.5 w-full px-2">
          <button
            onClick={onToggle}
            title="Open Sidebar"
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-500/10 group transition-all hover:scale-105"
          >
            <OryxLogo size={22} />
          </button>
          <button
            onClick={() => {
              if (onSwitchView) onSwitchView('chat');
              onNewChat();
            }}
            title="New Conversation"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => onOpenSearch && onOpenSearch()}
            title="Search Conversations (⌘K)"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => onSwitchView && onSwitchView('projects')}
            title="Projects Workspace"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <FolderKanban size={18} />
          </button>
        </div>

        <div className="w-full px-2 flex flex-col items-center gap-3">
          {user && (
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center text-xs">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Logout"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col h-screen select-none shrink-0 z-30">
        {/* Header */}
        <div className="p-3.5 flex flex-col gap-3 border-b border-zinc-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <OryxLogo size={26} />
              <div>
                <span className="text-xs font-bold text-zinc-100 tracking-tight">Oryx AI</span>
                <span className="block text-[10px] text-zinc-500 font-normal">Workspace Studio</span>
              </div>
            </div>
            <button
              onClick={onToggle}
              title="Collapse Sidebar"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (onSwitchView) onSwitchView('chat');
                onNewChat();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus size={15} />
              <span>New Chat</span>
            </button>

            <button
              onClick={() => {
                if (activeSessionId && onTogglePin) onTogglePin(activeSessionId);
              }}
              title={isCurrentPinned ? 'Unpin Current Chat' : 'Pin Current Chat'}
              className={`flex items-center justify-center p-2 rounded-xl border transition-colors ${
                isCurrentPinned
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
              }`}
            >
              <Pin size={15} className={isCurrentPinned ? 'fill-amber-400' : ''} />
            </button>

            <button
              onClick={() => onSwitchView && onSwitchView(currentView === 'projects' ? 'chat' : 'projects')}
              title="Toggle Projects Workspace"
              className={`flex items-center justify-center p-2 rounded-xl border transition-colors ${
                currentView === 'projects'
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
              }`}
            >
              <FolderKanban size={15} />
            </button>
          </div>

          {/* Search Button that triggers CommandPalette */}
          <button
            onClick={() => onOpenSearch && onOpenSearch()}
            className="w-full py-2 px-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 rounded-xl text-xs text-zinc-400 flex items-center justify-between transition-all group shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              <span className="group-hover:text-zinc-200 font-medium">Search history...</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/50">⌘K</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {pinnedSessions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-2 mb-1.5 flex items-center gap-1.5">
                <Pin size={10} className="fill-amber-400 text-amber-400" />
                <span>Pinned Chats</span>
              </div>
              <div className="space-y-1">{pinnedSessions.map(renderChatItem)}</div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-2 mb-1.5">
              Recent Conversations
            </div>
            <div className="space-y-1">
              {recentSessions.length === 0 ? (
                <div className="px-2 py-3 text-xs text-zinc-600 text-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800/50">
                  No conversations yet
                </div>
              ) : (
                recentSessions.map(renderChatItem)
              )}
            </div>
          </div>
        </div>

        {/* Archived footer button */}
        {archivedSessions.length > 0 && (
          <div className="px-3 py-2 border-t border-zinc-800/60">
            <button
              onClick={() => setShowArchivedModal(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800/50"
            >
              <div className="flex items-center gap-2">
                <Archive size={14} />
                <span>Archived Chats</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
                {archivedSessions.length}
              </span>
            </button>
          </div>
        )}

        {/* User Footer Profile */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 relative" ref={userMenuRef}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 flex-1 min-w-0 p-1.5 -ml-1 rounded-xl hover:bg-zinc-900 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="truncate flex-1">
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                  {user?.email || 'Aneeq Tariq'}
                </div>
                <div className="text-[10px] text-zinc-500 font-normal truncate">Enterprise Plan</div>
              </div>
              <MoreHorizontal size={15} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
            </button>
          </div>

          {/* User Popover Menu */}
          {userMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-zinc-300 backdrop-blur-2xl divide-y divide-zinc-800/60">
              <div className="py-1">
                <button
                  onClick={() => {
                    if (onOpenSettings) onOpenSettings();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-900 text-zinc-200 transition-colors font-medium"
                >
                  <Settings size={14} className="text-zinc-400" />
                  <span>Settings & Profile</span>
                </button>
              </div>

              {onLogout && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors font-medium"
                  >
                    <LogOut size={14} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Archived Chats Modal */}
      {showArchivedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                <Archive size={16} className="text-indigo-400" />
                <span>Archived Conversations</span>
              </div>
              <button
                onClick={() => setShowArchivedModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {archivedSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                >
                  <span className="truncate text-zinc-200 font-medium max-w-[220px]">
                    {session.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (onUnarchiveSession) onUnarchiveSession(session.id);
                        triggerToast('Unarchived');
                      }}
                      className="px-2.5 py-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg text-[11px] font-semibold transition-colors border border-indigo-500/30"
                    >
                      Unarchive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}