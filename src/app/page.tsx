'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/Header';
import EmptyState from '@/components/EmptyState';
import ChatCanvas from '@/components/ChatCanvas';
import ChatInput from '@/components/ChatInput';
import CommandPalette from '@/components/CommandPalette';
import OryxLogo from '@/components/OryxLogo';
import { ChatSession, ChatMessage, ModelOption } from '@/types/chat';
import { supabase } from '@/lib/supabase';
import {
  Settings,
  HelpCircle,
  Download,
  LogOut,
  X,
  Sun,
  Moon,
  Monitor,
  Globe,
  User,
  Database,
  Info,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  FolderKanban,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Paperclip,
  Brain,
  Sliders,
  MessageSquare,
  Pin,
  Archive,
  Edit2,
  Check,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  modifiedDate: string;
}

interface ProjectFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

const DEFAULT_MODEL: ModelOption = {
  id: 'llama-3.3-70b-versatile',
  name: 'Groq Llama 3.3 70B',
  description: 'Blazing fast institutional reasoning via Groq',
  speed: 'Lightning',
  context: '128k',
  icon: 'Zap',
};

export default function Home() {
  // ---- Auth ----
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ---- Login/Signup state ----
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authProcessing, setAuthProcessing] = useState(false);

  // ---- Chat & Workspace state ----
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ModelOption>(DEFAULT_MODEL);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [prompt, setPrompt] = useState('');

  // ---- Views & Projects ----
  const [currentView, setCurrentView] = useState<'chat' | 'projects'>('chat');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectInstructionsMap, setProjectInstructionsMap] = useState<Record<string, string>>({});
  const [projectFilesMap, setProjectFilesMap] = useState<Record<string, ProjectFile[]>>({});

  // Project prompt & input state
  const [projPrompt, setProjPrompt] = useState('');
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [instructionText, setInstructionText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Pins / Archives ----
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);

  // ---- Modals & Command Palette ----
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [settingsProject, setSettingsProject] = useState<Project | null>(null);
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'general' | 'profile' | 'data' | 'about'>('general');
  const [themePreference, setThemePreference] = useState<'dark' | 'light' | 'system'>('dark');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // ---- Hydrate Data from LocalStorage ----
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('oryx_projects');
      if (savedProjects) setProjects(JSON.parse(savedProjects));

      const savedSessions = localStorage.getItem('oryx_sessions');
      if (savedSessions) setSessions(JSON.parse(savedSessions));

      const savedMessages = localStorage.getItem('oryx_messages_map');
      if (savedMessages) setMessagesMap(JSON.parse(savedMessages));

      const savedPinned = localStorage.getItem('oryx_pinned');
      if (savedPinned) setPinnedIds(JSON.parse(savedPinned));

      const savedArchived = localStorage.getItem('oryx_archived');
      if (savedArchived) setArchivedIds(JSON.parse(savedArchived));

      const savedInstructions = localStorage.getItem('oryx_project_instructions');
      if (savedInstructions) setProjectInstructionsMap(JSON.parse(savedInstructions));

      const savedFiles = localStorage.getItem('oryx_project_files');
      if (savedFiles) setProjectFilesMap(JSON.parse(savedFiles));
    } catch (e) {
      console.error('Failed to parse localStorage data', e);
    }
  }, []);

  // ---- Persist Data on Changes ----
  useEffect(() => {
    localStorage.setItem('oryx_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('oryx_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('oryx_messages_map', JSON.stringify(messagesMap));
  }, [messagesMap]);

  useEffect(() => {
    localStorage.setItem('oryx_pinned', JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  useEffect(() => {
    localStorage.setItem('oryx_archived', JSON.stringify(archivedIds));
  }, [archivedIds]);

  useEffect(() => {
    localStorage.setItem('oryx_project_instructions', JSON.stringify(projectInstructionsMap));
  }, [projectInstructionsMap]);

  useEffect(() => {
    localStorage.setItem('oryx_project_files', JSON.stringify(projectFilesMap));
  }, [projectFilesMap]);

  // ---- Check Supabase Session on Mount ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ---- Auth Handlers ----
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthProcessing(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setAuthError(error.message);
    }
    setAuthProcessing(false);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    setAuthProcessing(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      triggerToast('Account created! Please check your email to confirm.');
    }
    setAuthProcessing(false);
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    triggerToast('Logged out');
  };

  // ---- Project Handlers ----
  const handleCreateProject = () => {
    if (!newProjName.trim()) return;
    const newProj: Project = {
      id: Date.now().toString(),
      name: newProjName.trim(),
      description: newProjDesc.trim() || 'No description',
      instructions: '',
      modifiedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    setProjects([newProj, ...projects]);
    setNewProjName('');
    setNewProjDesc('');
    setShowNewProjectModal(false);
    setActiveProjectId(newProj.id);
    setCurrentView('projects');
    triggerToast(`Project "${newProj.name}" created`);
  };

  const handleUpdateProject = () => {
    if (!settingsProject || !settingsName.trim()) return;
    setProjects(
      projects.map((p) =>
        p.id === settingsProject.id
          ? {
              ...p,
              name: settingsName.trim(),
              description: settingsDesc.trim(),
              modifiedDate: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
            }
          : p
      )
    );
    triggerToast('Project updated');
    setSettingsProject(null);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    triggerToast('Project deleted');
    setSettingsProject(null);
  };

  // ---- Chat Handlers ----
  const handleNewChat = (projId?: string) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      projectId: projId || activeProjectId || undefined,
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setCurrentView('chat');
  };

  const handleTogglePin = (id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleArchiveSession = (id: string) => {
    setArchivedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id && !archivedIds.includes(s.id));
      if (remaining.length > 0) setActiveSessionId(remaining[0].id);
    }
  };

  const handleUnarchiveSession = (id: string) => {
    setArchivedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleMoveToProject = (sessionId: string, projectId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, projectId } : s))
    );
    triggerToast('Chat moved to project');
  };

  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    setPinnedIds((prev) => prev.filter((item) => item !== id));
    setArchivedIds((prev) => prev.filter((item) => item !== id));
    const newMessagesMap = { ...messagesMap };
    delete newMessagesMap[id];
    setMessagesMap(newMessagesMap);

    if (activeSessionId === id) {
      const activeRemaining = remaining.filter((s) => !archivedIds.includes(s.id));
      if (activeRemaining.length > 0) setActiveSessionId(activeRemaining[0].id);
      else handleNewChat();
    }
  };

  // ---- Message Generation Stream ----
  const handleSendPromptText = async (textToSend: string, projId?: string) => {
    if (!textToSend.trim()) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId || currentView === 'projects') {
      const newId = Date.now().toString();
      const firstTitle = textToSend.trim().slice(0, 30) + (textToSend.length > 30 ? '...' : '');
      const newSession: ChatSession = {
        id: newId,
        title: firstTitle,
        projectId: projId || activeProjectId || undefined,
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newId);
      targetSessionId = newId;
    }

    const currentMsgs = messagesMap[targetSessionId] || [];
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const thinkingMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isThinking: true,
    };

    const updatedMsgs = [...currentMsgs, userMsg, thinkingMsg];
    setMessagesMap((prev) => ({ ...prev, [targetSessionId]: updatedMsgs }));
    setPrompt('');
    setProjPrompt('');
    setCurrentView('chat');

    // Rename title if default
    const currentSession = sessions.find((s) => s.id === targetSessionId);
    if (!currentSession || currentSession.title === 'New Conversation') {
      const titleSnippet = textToSend.trim().slice(0, 30) + (textToSend.length > 30 ? '...' : '');
      handleRenameSession(targetSessionId, titleSnippet);
    }

    try {
      // Collect project context instructions if chat belongs to a project
      const linkedProjId = currentSession?.projectId || projId || activeProjectId;
      const customInstruction = linkedProjId ? projectInstructionsMap[linkedProjId] : undefined;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.content,
          model: selectedModel.id,
          systemInstruction: customInstruction,
          history: currentMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server returned status ${res.status}`);
      }

      const assistantText = data.text || data.html || 'No response text generated.';

      const finalAssistantMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessagesMap((prev) => {
        const msgs = prev[targetSessionId] || [];
        const withoutThinking = msgs.filter((m) => !m.isThinking);
        return { ...prev, [targetSessionId]: [...withoutThinking, finalAssistantMsg] };
      });
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `⚠️ Error generating response: ${err.message || 'Network error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessagesMap((prev) => {
        const msgs = prev[targetSessionId] || [];
        const withoutThinking = msgs.filter((m) => !m.isThinking);
        return { ...prev, [targetSessionId]: [...withoutThinking, errorMsg] };
      });
    }
  };

  const handleSend = () => {
    handleSendPromptText(prompt);
  };

  // Upload file for Project Memory
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeProjectId) return;
    const file = e.target.files[0];
    const newFileObj: ProjectFile = {
      id: Date.now().toString(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'Document',
    };

    const currentFiles = projectFilesMap[activeProjectId] || [];
    setProjectFilesMap({
      ...projectFilesMap,
      [activeProjectId]: [...currentFiles, newFileObj],
    });
    triggerToast(`File "${file.name}" added to project memory`);
  };

  const handleSaveInstruction = () => {
    if (!activeProjectId) return;
    setProjectInstructionsMap({
      ...projectInstructionsMap,
      [activeProjectId]: instructionText,
    });
    setEditingInstructions(false);
    triggerToast('Project instructions updated');
  };

  // ---- Derived State ----
  const visibleSessions = sessions.filter((s) => !archivedIds.includes(s.id));
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeMessages = (activeSessionId && messagesMap[activeSessionId]) || [];

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const projectChats = sessions.filter(
    (s) => s.projectId === activeProjectId && !archivedIds.includes(s.id)
  );

  // ---- Auth Loading Screen ----
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100">
        <OryxLogo size={42} className="animate-pulse mb-4" />
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          Initializing Oryx AI Workspace...
        </div>
      </div>
    );
  }

  // ---- Auth Screen (Login / Signup) ----
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -top-40 -left-40 animate-ambient" />
        <div className="absolute w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -bottom-20 -right-20 animate-pulse" />

        <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <OryxLogo size={48} className="mb-3" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Access your institutional Groq AI workspace studio
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
              {authError}
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleEmailLogin : handleEmailSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={authProcessing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {authProcessing ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Sign In to Workspace' : 'Create New Account'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-zinc-900 px-3 text-zinc-500 font-semibold">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.2v3.15C3.16 21.32 7.23 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.2C.44 8.12 0 9.87 0 12s.44 3.88 1.2 5.42l4.08-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.16 2.68 1.2 6.58l4.08 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Continue with Google
          </button>

          <div className="text-center mt-6">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthError(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-xs text-zinc-400 hover:text-indigo-400 transition-colors font-medium"
            >
              {authMode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Log in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Render Main App Workspace ----
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden font-sans relative select-none">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        sessions={visibleSessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setCurrentView('chat');
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePin={handleTogglePin}
        pinnedIds={pinnedIds}
        onMoveToProject={handleMoveToProject}
        onArchiveSession={handleArchiveSession}
        archivedIds={archivedIds}
        onUnarchiveSession={handleUnarchiveSession}
        currentView={currentView}
        onSwitchView={setCurrentView}
        projects={projects}
        setProjects={setProjects}
        showNewProjectModal={showNewProjectModal}
        setShowNewProjectModal={setShowNewProjectModal}
        newProjName={newProjName}
        setNewProjName={setNewProjName}
        newProjDesc={newProjDesc}
        setNewProjDesc={setNewProjDesc}
        settingsProject={settingsProject}
        setSettingsProject={setSettingsProject}
        settingsName={settingsName}
        setSettingsName={setSettingsName}
        settingsDesc={settingsDesc}
        setSettingsDesc={setSettingsDesc}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        triggerToast={triggerToast}
        confirmConfig={confirmConfig}
        setConfirmConfig={setConfirmConfig}
        onLogout={handleLogout}
        user={user}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSearch={() => setIsCmdOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full bg-zinc-950">
        <Header
          title={
            currentView === 'projects'
              ? currentProject
                ? currentProject.name
                : 'Projects Workspace'
              : activeSession?.title || 'Oryx AI Workspace'
          }
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onRenameTitle={(newTitle) => {
            if (currentView === 'chat' && activeSessionId) {
              handleRenameSession(activeSessionId, newTitle);
            }
          }}
          onOpenSearch={() => setIsCmdOpen(true)}
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
          {currentView === 'projects' ? (
            activeProjectId && currentProject ? (
              /* ---- CLAUDE STYLE PROJECT WORKSPACE (REFERENCE IMAGE 3) ---- */
              <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
                {/* Top Back Navigation & Title */}
                <div>
                  <button
                    onClick={() => setActiveProjectId(null)}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
                  >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span>All projects</span>
                  </button>

                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                        {currentProject.name}
                      </h1>
                      <p className="text-xs text-zinc-400 mt-1">{currentProject.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSettingsProject(currentProject);
                          setSettingsName(currentProject.name);
                          setSettingsDesc(currentProject.description);
                        }}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Project Settings"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Project Prompt & Chat List */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Prompt Box */}
                    <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 shadow-xl space-y-3">
                      <textarea
                        value={projPrompt}
                        onChange={(e) => setProjPrompt(e.target.value)}
                        placeholder="How can I help you today?"
                        rows={3}
                        className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none"
                      />
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
                          title="Attach Context File"
                        >
                          <Plus size={16} />
                        </button>

                        <button
                          onClick={() => {
                            if (projPrompt.trim()) {
                              handleSendPromptText(projPrompt, currentProject.id);
                            }
                          }}
                          disabled={!projPrompt.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
                        >
                          Send Prompt
                        </button>
                      </div>
                    </div>

                    {/* Reference Knowledge Notice */}
                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 py-2 border-b border-zinc-800/60">
                      <Brain size={15} className="text-indigo-400" />
                      <span>Oryx AI references the same knowledge every time you talk to it in this project.</span>
                    </div>

                    {/* Project Chats Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Project Conversations ({projectChats.length})
                        </h3>
                        <button
                          onClick={() => handleNewChat(currentProject.id)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                        >
                          <Plus size={13} /> New Chat in Project
                        </button>
                      </div>

                      {projectChats.length === 0 ? (
                        <div className="text-center py-10 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800/60 text-zinc-500 text-xs">
                          No chats in this project yet. Send a prompt above to start!
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {projectChats.map((session) => (
                            <div
                              key={session.id}
                              onClick={() => {
                                setActiveSessionId(session.id);
                                setCurrentView('chat');
                              }}
                              className="group flex items-center justify-between p-3.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <MessageSquare size={16} className="text-indigo-400 shrink-0" />
                                <div>
                                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate max-w-xs">
                                    {session.title}
                                  </h4>
                                  <span className="text-[10px] text-zinc-500">
                                    Updated: {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(session.id);
                                }}
                                className="p-1.5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Memory, Instructions & Files */}
                  <div className="space-y-4">
                    {/* Memory Card */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-zinc-300">Memory</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">Auto-synced</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Project memory will show key takeaways here after a few chats.
                      </p>
                    </div>

                    {/* Instructions Card */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300">Instructions</span>
                        <button
                          onClick={() => {
                            setInstructionText(projectInstructionsMap[currentProject.id] || '');
                            setEditingInstructions(!editingInstructions);
                          }}
                          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      {editingInstructions ? (
                        <div className="space-y-2">
                          <textarea
                            value={instructionText}
                            onChange={(e) => setInstructionText(e.target.value)}
                            placeholder="Add custom instructions to tailor AI responses for this project..."
                            rows={3}
                            className="w-full bg-zinc-950 border border-indigo-500/40 rounded-xl p-2 text-xs text-zinc-200 focus:outline-none"
                          />
                          <button
                            onClick={handleSaveInstruction}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Save Instructions
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">
                          {projectInstructionsMap[currentProject.id] || 'Add instructions to tailor AI responses for this project.'}
                        </p>
                      )}
                    </div>

                    {/* Files Card */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300">Files</span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                        >
                          <Plus size={15} />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>

                      {(!projectFilesMap[currentProject.id] || projectFilesMap[currentProject.id].length === 0) ? (
                        <p className="text-xs text-zinc-500">Upload documents or files for project context.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {projectFilesMap[currentProject.id].map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <FileText size={14} className="text-indigo-400 shrink-0" />
                                <span className="truncate text-zinc-200">{file.name}</span>
                              </div>
                              <span className="text-[10px] text-zinc-500 shrink-0">{file.size}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ---- PROJECTS LIST VIEW ---- */
              <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                      <FolderKanban className="text-indigo-400" />
                      <span>Projects Workspace</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 font-medium">
                      Organize custom AI instructions, project scopes, and context files.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    <span>New Project</span>
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-800/80">
                    <FolderKanban size={36} className="mx-auto text-zinc-600 mb-3" />
                    <h3 className="text-sm font-semibold text-zinc-300">No projects yet</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Create your first project to organize your custom AI instructions, context files, and workflows.
                    </p>
                    <button
                      onClick={() => setShowNewProjectModal(true)}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all"
                    >
                      + Create New Project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => setActiveProjectId(proj.id)}
                        className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 cursor-pointer transition-all shadow-md flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                              {proj.name}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium border border-zinc-700/50">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{proj.description}</p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/80 pt-3.5 mt-4">
                          <span>Modified: {proj.modifiedDate}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSettingsProject(proj);
                              setSettingsName(proj.name);
                              setSettingsDesc(proj.description);
                            }}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Settings
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : activeMessages.length === 0 ? (
            <EmptyState
              onSelectSuggestion={(text) => {
                setPrompt(text);
              }}
            />
          ) : (
            <ChatCanvas messages={activeMessages} />
          )}
        </div>

        {currentView === 'chat' && (
          <ChatInput prompt={prompt} setPrompt={setPrompt} onSend={handleSend} />
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        sessions={visibleSessions}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setCurrentView('chat');
        }}
        onNewChat={handleNewChat}
        onSwitchView={setCurrentView}
      />

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight">Create New Project</h3>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g., E-Commerce App"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description</label>
                <textarea
                  placeholder="Brief overview of project goals..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      {settingsProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight">Project Settings</h3>
              <button
                onClick={() => setSettingsProject(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description</label>
                <textarea
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => handleDeleteProject(settingsProject.id)}
                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold border border-red-500/20"
              >
                Delete
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSettingsProject(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProject}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col h-[70vh] overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Workspace Settings</h3>
                  <p className="text-[11px] text-zinc-400">Preferences, account information, and data</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-48 bg-zinc-900/30 border-r border-zinc-800/80 p-3 space-y-1 shrink-0">
                <button
                  onClick={() => setSettingsActiveTab('general')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    settingsActiveTab === 'general'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Settings size={14} />
                  <span>General</span>
                </button>
                <button
                  onClick={() => setSettingsActiveTab('profile')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    settingsActiveTab === 'profile'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <User size={14} />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setSettingsActiveTab('data')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    settingsActiveTab === 'data'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Database size={14} />
                  <span>Data</span>
                </button>
                <button
                  onClick={() => setSettingsActiveTab('about')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    settingsActiveTab === 'about'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Info size={14} />
                  <span>About</span>
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {settingsActiveTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Appearance Theme</h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setThemePreference('dark')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                            themePreference === 'dark'
                              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                          }`}
                        >
                          <Moon size={15} /> Dark
                        </button>
                        <button
                          onClick={() => setThemePreference('system')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                            themePreference === 'system'
                              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                          }`}
                        >
                          <Monitor size={15} /> System
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Language</h3>
                      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
                        <Globe size={16} className="text-zinc-400" />
                        <span className="text-xs text-zinc-200 font-medium">English</span>
                        <span className="text-[10px] text-zinc-500 ml-auto">(United States)</span>
                      </div>
                    </div>
                  </div>
                )}

                {settingsActiveTab === 'profile' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">User Profile</label>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-medium">
                        {user?.user_metadata?.full_name || user?.email || 'User'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email Address</label>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-medium">
                        {user?.email || 'Not set'}
                      </div>
                    </div>
                  </div>
                )}

                {settingsActiveTab === 'data' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Export & Import</h3>
                      <button
                        onClick={() => triggerToast('Import feature coming soon')}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Upload size={16} /> Import Data File
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Clear Workspace</h3>
                      <button
                        onClick={() => {
                          setConfirmConfig({
                            isOpen: true,
                            title: 'Clear Workspace Data',
                            message: 'Are you sure you want to delete all local sessions and projects?',
                            onConfirm: () => {
                              setSessions([]);
                              setMessagesMap({});
                              setPinnedIds([]);
                              setArchivedIds([]);
                              setProjects([]);
                              setProjectInstructionsMap({});
                              setProjectFilesMap({});
                              localStorage.clear();
                              triggerToast('All data cleared');
                              setConfirmConfig(null);
                            },
                          });
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Trash2 size={16} /> Delete all workspace data
                      </button>
                    </div>
                  </div>
                )}

                {settingsActiveTab === 'about' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <OryxLogo size={40} />
                      <div>
                        <h3 className="text-sm font-bold text-white">Oryx AI Studio</h3>
                        <p className="text-xs text-zinc-400">Version 2.0 Pro</p>
                      </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs text-zinc-300">
                      <p><span className="text-zinc-500">Engine:</span> Ryzen Accelerated Groq LLM</p>
                      <p><span className="text-zinc-500">Framework:</span> Next.js 16 + Tailwind CSS</p>
                      <p><span className="text-zinc-500">License:</span> MIT Pro</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end shrink-0">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmConfig && confirmConfig.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-2">{confirmConfig.title}</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{confirmConfig.message}</p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmConfig(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-zinc-900/95 border border-indigo-500/40 text-zinc-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-medium backdrop-blur-xl">
            <CheckCircle2 size={16} className="text-indigo-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}