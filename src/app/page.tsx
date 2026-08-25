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
import { BOSS_MODEL } from '@/lib/models';
import { supabase } from '@/lib/supabase';
import {
  loadSessionsFromDB,
  upsertSessionToDB,
  deleteSessionFromDB,
  updateSessionInDB,
  loadMessagesFromDB,
  insertMessageToDB,
  deleteMessagesForSession,
} from '@/lib/chatStorage';
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
  Zap,
  Layers,
  Cpu,
  Smartphone,
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

const DEFAULT_MODEL: ModelOption = BOSS_MODEL as ModelOption;

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
  const [currentView, setCurrentView] = useState<'chat' | 'projects' | 'cloudbrain' | 'getapp'>('chat');

  // ---- PWA install ----
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Register service worker (enables install + offline)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    // Already installed? (launched as standalone app)
    if (window.matchMedia('(display-mode: standalone)').matches) setIsAppInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') triggerToast('Oryx AI app installed! 🎉');
    setInstallPrompt(null);
  };
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
  // Streaming state — Stop button + AbortController
  const [isGenerating, setIsGenerating] = useState(false);
  // Image mode toggle — forces every prompt to generate an image (ChatGPT-style)
  const [imageMode, setImageMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
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

  // Apply theme to body and persist in localStorage
  useEffect(() => {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark', 'theme-system');
    if (themePreference === 'light') {
      body.classList.add('theme-light');
    } else if (themePreference === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (!prefersDark) body.classList.add('theme-light');
    }
    localStorage.setItem('oryx_theme', themePreference);
  }, [themePreference]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('oryx_theme') as 'dark' | 'light' | 'system' | null;
    if (saved) setThemePreference(saved);
  }, []);

  // API Keys state
  const [keyStatuses, setKeyStatuses] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [savingKeyName, setSavingKeyName] = useState<string | null>(null);

  const fetchKeyStatuses = async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.statuses) setKeyStatuses(data.statuses);
    } catch (e) {
      console.error('Failed to fetch key statuses', e);
    }
  };

  // Refresh Cloud Brain statuses whenever the view opens
  useEffect(() => {
    if (currentView === 'cloudbrain') fetchKeyStatuses();
  }, [currentView]);

  // Auto-scroll to bottom whenever messages update (smooth scroll during streaming)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messagesMap, activeSessionId]);

  const handleSaveKey = async (envName: string) => {
    const value = (keyInputs[envName] || '').trim();
    if (!value) return;
    setSavingKeyName(envName);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: envName, value }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save');
      setKeyStatuses(data.statuses || keyStatuses);
      setKeyInputs((prev) => ({ ...prev, [envName]: '' }));
      triggerToast('Brain connected — Boss Agent can use it now');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save key');
    } finally {
      setSavingKeyName(null);
    }
  };

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

  // ---- Hydrate Data: Supabase (sessions) + LocalStorage (projects, pinned, etc.) ----
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('oryx_projects');
      if (savedProjects) setProjects(JSON.parse(savedProjects));
      const savedInstructions = localStorage.getItem('oryx_project_instructions');
      if (savedInstructions) setProjectInstructionsMap(JSON.parse(savedInstructions));
      const savedFiles = localStorage.getItem('oryx_project_files');
      if (savedFiles) setProjectFilesMap(JSON.parse(savedFiles));
    } catch (e) {
      console.error('Failed to parse localStorage data', e);
    }
  }, []);

  // Load chat sessions from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setMessagesMap({});
      setPinnedIds([]);
      setArchivedIds([]);
      return;
    }
    (async () => {
      const dbSessions = await loadSessionsFromDB(user.id);
      setSessions(dbSessions);
      const pinnedFromDB = dbSessions.filter((s: any) => s.pinned).map((s: any) => s.id);
      const archivedFromDB = dbSessions.filter((s: any) => s.archived).map((s: any) => s.id);
      if (pinnedFromDB.length) setPinnedIds(pinnedFromDB);
      if (archivedFromDB.length) setArchivedIds(archivedFromDB);
    })();
  }, [user]);

  // ---- Persist Data on Changes ----
  useEffect(() => {
    localStorage.setItem('oryx_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('oryx_project_instructions', JSON.stringify(projectInstructionsMap));
  }, [projectInstructionsMap]);

  useEffect(() => {
    localStorage.setItem('oryx_project_files', JSON.stringify(projectFilesMap));
  }, [projectFilesMap]);

  // ---- Global keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Load messages for active session
  useEffect(() => {
    if (!activeSessionId || !user) return;
    if (messagesMap[activeSessionId]) return; // already loaded locally
    (async () => {
      const msgs = await loadMessagesFromDB(activeSessionId, user.id);
      if (msgs.length > 0) {
        setMessagesMap((prev) => ({ ...prev, [activeSessionId]: msgs }));
      }
    })();
  }, [activeSessionId, user]);

  // ---- Check Supabase Session on Mount ----
  useEffect(() => {
    // Fallback: if Supabase is slow or offline, don't block the user
    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 800);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      clearTimeout(timeout);
    }).catch(() => {
      setAuthLoading(false);
      clearTimeout(timeout);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
    if (user) upsertSessionToDB(newSession, user.id);
  };

  const handleTogglePin = (id: string) => {
    setPinnedIds((prev) => {
      const isNowPinned = !prev.includes(id);
      if (user) updateSessionInDB(id, { pinned: isNowPinned });
      return isNowPinned ? [...prev, id] : prev.filter((item) => item !== id);
    });
  };

  const handleArchiveSession = (id: string) => {
    setArchivedIds((prev) => {
      if (user) updateSessionInDB(id, { archived: true });
      return prev.includes(id) ? prev : [...prev, id];
    });
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id && !archivedIds.includes(s.id));
      if (remaining.length > 0) setActiveSessionId(remaining[0].id);
    }
  };

  const handleUnarchiveSession = (id: string) => {
    if (user) updateSessionInDB(id, { archived: false });
    setArchivedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    if (user) updateSessionInDB(id, { title: newTitle });
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleMoveToProject = (sessionId: string, projectId: string) => {
    if (user) updateSessionInDB(sessionId, { project_id: projectId });
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, projectId } : s))
    );
    triggerToast('Chat moved to project');
  };

  const handleDeleteSession = (id: string) => {
    if (user) deleteSessionFromDB(id);
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

    // Save to DB
    if (user) {
      const fallbackTitle = textToSend.trim().slice(0, 30) + (textToSend.length > 30 ? '...' : '');
      const activeSess = sessions.find(s => s.id === targetSessionId) || { id: targetSessionId, title: fallbackTitle, projectId: projId || activeProjectId || undefined, updatedAt: new Date().toISOString() };
      upsertSessionToDB({ ...activeSess, updatedAt: new Date().toISOString() }, user.id);
      insertMessageToDB(userMsg, targetSessionId, user.id);
    }

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
      const streamMsgId = thinkingMsg.id;

      const controller = new AbortController();
      abortRef.current = controller;
      setIsGenerating(true);

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.content,
          model: selectedModel.id,
          systemInstruction: customInstruction,
          history: currentMsgs.map((m) => ({ role: m.role, content: m.content })),
          stream: !imageMode,
          imageMode: !!imageMode,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server returned status ${res.status}`);
      }

      const finalize = (
        text: string,
        modelUsed?: string,
        msgType?: 'chat' | 'image',
        imageUrl?: string,
        imagePrompt?: string,
        taskMode?: string
      ) => {
        setMessagesMap((prev) => {
          const msgs = prev[targetSessionId] || [];
          const newAssistantMsg: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed,
            type: msgType,
            imageUrl,
            imagePrompt,
            taskMode,
          };
          
          if (user) insertMessageToDB(newAssistantMsg, targetSessionId, user.id);
          
          return {
            ...prev,
            [targetSessionId]: [
              ...msgs.filter((m) => !m.isThinking && m.id !== streamMsgId),
              newAssistantMsg,
            ],
          };
        });
      };

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && res.body) {
        // ---- Live SSE streaming ----
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let full = '';

        const patchStream = (text: string, modelUsed?: string) => {
          setMessagesMap((prev) => {
            const msgs = prev[targetSessionId] || [];
            return {
              ...prev,
              [targetSessionId]: msgs.map((m) =>
                m.id === streamMsgId ? { ...m, content: text, isThinking: false, modelUsed: modelUsed ?? m.modelUsed } : m
              ),
            };
          });
        };

        let streamModelUsed: string | undefined;
        let streamTaskMode: string | undefined;

        const patchStreamTask = (taskMode: string, modelUsed?: string) => {
          setMessagesMap((prev) => {
            const msgs = prev[targetSessionId] || [];
            return {
              ...prev,
              [targetSessionId]: msgs.map((m) =>
                m.id === streamMsgId ? { ...m, taskMode, modelUsed: modelUsed ?? m.modelUsed } : m
              ),
            };
          });
        };

        // Throttle UI updates: batch stream chunks into ~50ms frames so the
        // page doesn't re-render on every single SSE token (causes lag)
        let queuedFull = '';
        let flushTimer: ReturnType<typeof setTimeout> | null = null;
        const flushStream = () => {
          if (flushTimer) return;
          flushTimer = setTimeout(() => {
            flushTimer = null;
            if (queuedFull) patchStream(queuedFull, streamModelUsed);
          }, 50);
        };

        let wasAborted = false;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const data = trimmed.slice(5).trim();
              if (data === '[DONE]') continue;
              try {
                const json = JSON.parse(data);
                if (json.error) throw new Error(json.error);
                if (json.status === 'model' && json.model) {
                  // Boss Agent announced its model choice + detected task mode
                  streamModelUsed = `${json.model} · ${json.provider}`;
                  if (json.categoryLabel) {
                    streamTaskMode = json.categoryLabel as string;
                    patchStreamTask(streamTaskMode, streamModelUsed);
                  }
                  patchStream('', streamModelUsed);
                } else if (json.status === 'done' && json.modelUsed) {
                  streamModelUsed = json.modelUsed;
                } else if (json.text) {
                  full += json.text;
                  queuedFull = full;
                  flushStream();
                }
              } catch (e: any) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        } catch (streamErr: any) {
          if (streamErr?.name === 'AbortError') {
            wasAborted = true;
          } else {
            throw streamErr;
          }
        }
        if (flushTimer) clearTimeout(flushTimer);
        if (full.trim()) {
          finalize(
            wasAborted ? `${full}\n\n*⏹ Generation stopped*` : full,
            streamModelUsed,
            'chat',
            undefined,
            undefined,
            streamTaskMode
          );
        } else if (wasAborted) {
          // Stopped before anything streamed — just drop the thinking bubble
          setMessagesMap((prev) => {
            const msgs = prev[targetSessionId] || [];
            return { ...prev, [targetSessionId]: msgs.filter((m) => m.id !== streamMsgId) };
          });
        } else {
          throw new Error('Stream returned empty response');
        }
      } else {
        // ---- JSON fallback (image gen, errors, non-stream) ----
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const msgType = data.type === 'image' ? 'image' : 'chat';
        finalize(
          data.text || data.html || 'No response text generated.',
          data.modelUsed,
          msgType,
          data.imageUrl,
          data.imagePrompt,
          data.categoryLabel
        );
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // Handled inside the stream loop — just clean up
        setIsGenerating(false);
        abortRef.current = null;
        return;
      }
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
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const handleSend = () => {
    handleSendPromptText(prompt);
  };

  // Stop the in-flight generation (keeps whatever streamed so far)
  const handleStopGeneration = () => {
    abortRef.current?.abort();
  };

  // ChatGPT-style edit: truncate conversation at that message and put text back in composer
  const handleEditMessage = (msg: ChatMessage) => {
    if (!activeSessionId) return;
    const msgs = messagesMap[activeSessionId] || [];
    const idx = msgs.findIndex((m) => m.id === msg.id);
    if (idx === -1) return;
    setMessagesMap((prev) => ({ ...prev, [activeSessionId]: msgs.slice(0, idx) }));
    setPrompt(msg.content);
    setCurrentView('chat');
  };

  // Export the current chat as a Markdown file
  const handleExportChat = () => {
    if (!activeSessionId) {
      triggerToast('Nothing to export yet');
      return;
    }
    const msgs = messagesMap[activeSessionId] || [];
    if (msgs.length === 0) {
      triggerToast('Nothing to export yet');
      return;
    }
    const session = sessions.find((s) => s.id === activeSessionId);
    const md = [
      `# ${session?.title || 'Oryx Chat'}`,
      `*Exported from Oryx AI Workspace — ${new Date().toLocaleString()}*`,
      ...msgs.map((m) =>
        m.role === 'user'
          ? `## 🧑 You\n\n${m.content}`
          : `## 🤖 Oryx AI\n\n${m.content}`
      ),
    ].join('\n\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(session?.title || 'oryx-chat').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Chat exported as Markdown');
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
    <div className="min-h-screen bg-[#212121] text-[#ececec] flex overflow-hidden font-sans relative select-none">
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
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setCurrentView('projects');
        }}
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
        onOpenCloudBrain={() => setCurrentView('cloudbrain')}
        onOpenGetApp={() => setCurrentView('getapp')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full bg-[#212121]">
        {/* Ambient background glow — unique Oryx touch */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[280px] bg-indigo-500/[0.06] rounded-full blur-[110px] animate-ambient" />
        <div className="pointer-events-none absolute bottom-10 -right-20 w-[420px] h-[420px] bg-purple-500/[0.05] rounded-full blur-[100px]" />

        <Header
          title={
            currentView === 'cloudbrain'
              ? 'Cloud Brain'
              : currentView === 'getapp'
              ? 'Get the App'
              : currentView === 'projects'
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
          onExportChat={handleExportChat}
        />

        <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
          {currentView === 'getapp' ? (
            /* ---- GET THE APP — install on Android & Windows ---- */
            <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-10">
              <div className="text-center mb-10">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-5">
                  <Smartphone size={28} className="text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Get the App</h1>
                <p className="text-sm text-[#afafaf] mt-3 max-w-lg mx-auto leading-relaxed">
                  Install <span className="text-indigo-400 font-semibold">Oryx AI</span> as a real app on your phone or
                  PC — works offline, opens in its own window, auto-updates, and gets a home-screen icon.
                </p>
                {isAppInstalled && (
                  <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 size={14} /> App is installed on this device
                  </div>
                )}
              </div>

              {/* One-tap install (browser supports prompt) */}
              {installPrompt && (
                <div className="mb-6 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-5 text-center">
                  <h3 className="text-sm font-bold text-white mb-1">⚡ One-Tap Install Available</h3>
                  <p className="text-xs text-[#afafaf] mb-4">Your browser detected Oryx AI as an installable app.</p>
                  <button
                    onClick={handleInstallApp}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-colors"
                  >
                    Install Oryx AI Now
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Android */}
                <div className="rounded-2xl bg-[#2B2926]/60 border border-white/[0.07] p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-400">
                        <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.45-.63-3.07-1-4.47-1-1.4 0-3.02.37-4.47 1L5.65 5.67c-.18-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25S6.31 12.75 7 12.75s1.25.56 1.25 1.25S7.69 15.25 7 15.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Android — APK-style App</h3>
                      <p className="text-[11px] text-[#8f8b84]">Home-screen icon · fullscreen · offline</p>
                    </div>
                  </div>
                  <ol className="text-xs text-[#c9c5bd] space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <code className="text-indigo-300">http://192.168.100.25:3000</code> in <b>Chrome</b> on your phone (same WiFi)</li>
                    <li>Tap the <b>⋮ menu</b> (top-right)</li>
                    <li>Tap <b>"Install app"</b> or <b>"Add to Home screen"</b></li>
                    <li>Oryx AI icon appears — opens like a native APK app 🎉</li>
                  </ol>
                </div>

                {/* Windows */}
                <div className="rounded-2xl bg-[#2B2926]/60 border border-white/[0.07] p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-400">
                        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.351L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Windows — .exe-style App</h3>
                      <p className="text-[11px] text-[#8f8b84]">Own window · taskbar pin · Start menu</p>
                    </div>
                  </div>
                  <ol className="text-xs text-[#c9c5bd] space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <b>http://localhost:3000</b> in <b>Edge</b> or <b>Chrome</b> on this PC</li>
                    <li>Click the <b>install icon ⊕</b> in the address bar (or menu → <b>Apps → Install</b>)</li>
                    <li>Click <b>Install</b></li>
                    <li>Oryx AI opens in its own window — pin it like any .exe app 🎉</li>
                  </ol>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 text-[11px] text-[#8f8b84] leading-relaxed">
                <b className="text-[#c9c5bd]">Why PWA instead of raw APK/.exe files?</b> The app is a full-stack AI
                workspace (server + 5 AI providers) — PWA install gives you the same home-screen icon, own window and
                offline shell <b>instantly on both platforms</b>, stays auto-updated, and works from any device on your
                WiFi. Building a store-ready native APK/.exe additionally requires Android Studio / Electron packaging
                on this machine.
              </div>
            </div>
          ) : currentView === 'cloudbrain' ? (
            /* ---- CLOUD BRAIN — AI provider hub (Claude-style) ---- */
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-10">
              {/* Hero */}
              <div className="text-center mb-10">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D97757] to-[#B85C3E] flex items-center justify-center shadow-xl shadow-[#D97757]/25 mb-5">
                  <Brain size={30} className="text-white" />
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#FAF9F5] tracking-tight">
                  Cloud Brain
                </h1>
                <p className="text-sm text-[#A8A49C] mt-3 max-w-lg mx-auto leading-relaxed">
                  Connect your AI providers once — <span className="text-[#D97757] font-semibold">Boss Agent</span>{' '}
                  automatically routes every task to the best connected brain, and switches when a free tier runs dry.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
                  <span className="px-3.5 py-1.5 rounded-full bg-[#D97757]/10 border border-[#D97757]/25 text-[#D97757] text-xs font-semibold">
                    {Object.values(keyStatuses).filter(Boolean).length} of 5 brains connected
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#A8A49C] text-xs font-semibold">
                    {Object.values(keyStatuses).filter(Boolean).length * 2}+ models in Boss pool
                  </span>
                </div>
              </div>

              {/* Provider cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    provider: 'Claude',
                    envName: 'ANTHROPIC_API_KEY',
                    models: 'Sonnet 4 · Haiku 3.5 — elite coding & writing',
                    link: 'https://console.anthropic.com/settings/keys',
                    note: 'Anthropic Console → API Keys',
                    icon: <Sparkles size={18} className="text-[#D97757]" />,
                    iconBg: 'bg-[#D97757]/15 border border-[#D97757]/30',
                    featured: true,
                  },
                  {
                    provider: 'Groq',
                    envName: 'GROQ_API_KEY',
                    models: 'Llama 3.3 70B · DeepSeek R1 — lightning fast',
                    link: 'https://console.groq.com/keys',
                    note: 'Free tier · daily rate limits',
                    icon: <Zap size={18} className="text-amber-400" />,
                    iconBg: 'bg-amber-500/15 border border-amber-500/30',
                  },
                  {
                    provider: 'Gemini',
                    envName: 'GEMINI_API_KEY',
                    models: '2.0 Flash · 1.5 Pro — 1M+ context',
                    link: 'https://aistudio.google.com/apikey',
                    note: 'Google AI Studio · generous free tier',
                    icon: <Sparkles size={18} className="text-blue-400" />,
                    iconBg: 'bg-blue-500/15 border border-blue-500/30',
                  },
                  {
                    provider: 'OpenRouter',
                    envName: 'OPENROUTER_API_KEY',
                    models: 'DeepSeek V3 · Llama 3.3 — 300+ models',
                    link: 'https://openrouter.ai/settings/keys',
                    note: 'Free models · daily caps',
                    icon: <Layers size={18} className="text-purple-400" />,
                    iconBg: 'bg-purple-500/15 border border-purple-500/30',
                  },
                  {
                    provider: 'NVIDIA',
                    envName: 'NVIDIA_API_KEY',
                    models: 'Nemotron 70B · Qwen Coder — NIM engine',
                    link: 'https://build.ngc.nvidia.com',
                    note: 'NVIDIA NIM · free API credits',
                    icon: <Cpu size={18} className="text-emerald-400" />,
                    iconBg: 'bg-emerald-500/15 border border-emerald-500/30',
                  },
                ].map((p) => {
                  const configured = keyStatuses[p.provider];
                  return (
                    <div
                      key={p.envName}
                      className={`rounded-2xl p-5 space-y-4 transition-all ${
                        configured
                          ? 'bg-[#2B2926] border border-[#D97757]/25 shadow-lg shadow-[#D97757]/5'
                          : 'bg-[#2B2926]/60 border border-white/[0.07] hover:border-white/15'
                      } ${p.featured ? 'md:col-span-2' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${p.iconBg}`}>
                            {p.icon}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-serif text-base font-semibold text-[#FAF9F5] leading-tight">
                              {p.provider}
                              {p.featured && (
                                <span className="ml-2 text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-[#D97757]/15 text-[#D97757] border border-[#D97757]/30 align-middle">
                                  RECOMMENDED
                                </span>
                              )}
                            </h3>
                            <p className="text-[11px] text-[#A8A49C] mt-0.5 truncate">{p.models}</p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            configured
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-white/5 text-[#8f8b84] border-white/10'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-400 animate-pulse' : 'bg-[#5c5850]'}`} />
                          {configured ? 'Connected' : 'Not connected'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          placeholder={configured ? 'Paste new key to replace…' : 'Paste API key to connect this brain…'}
                          value={keyInputs[p.envName] || ''}
                          onChange={(e) => setKeyInputs((prev) => ({ ...prev, [p.envName]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveKey(p.envName)}
                          className="flex-1 min-w-0 bg-black/25 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF9F5] placeholder-[#6e6a63] focus:outline-none focus:border-[#D97757]/60 font-mono"
                        />
                        <button
                          onClick={() => handleSaveKey(p.envName)}
                          disabled={!keyInputs[p.envName]?.trim() || savingKeyName === p.envName}
                          className="px-4 py-2.5 bg-[#D97757] hover:bg-[#c96a4b] disabled:opacity-40 disabled:hover:bg-[#D97757] text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
                        >
                          {savingKeyName === p.envName ? 'Connecting…' : configured ? 'Replace' : 'Connect'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#8f8b84]">{p.note}</span>
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#D97757] hover:text-[#e08a6c] font-semibold"
                        >
                          Get API Key ↗
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-[11px] text-[#77746d] mt-8 leading-relaxed">
                🔒 Keys are stored locally in <code className="text-[#A8A49C]">.env.local</code> on your machine only —
                active instantly, no restart needed.
              </p>
            </div>
          ) : currentView === 'projects' ? (
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
            <ChatCanvas messages={activeMessages} onEditMessage={handleEditMessage} />
          )}
          <div ref={messagesEndRef} className="h-px" />
        </div>

        {currentView === 'chat' && (
          <ChatInput
            prompt={prompt}
            setPrompt={setPrompt}
            onSend={handleSend}
            isGenerating={isGenerating}
            onStop={handleStopGeneration}
            imageMode={imageMode}
            setImageMode={setImageMode}
          />
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        sessions={visibleSessions}
        messagesMap={messagesMap}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setCurrentView('chat');
        }}
        onNewChat={handleNewChat}
        onSwitchView={setCurrentView}
        onOpenCloudBrain={() => setCurrentView('cloudbrain')}
        onExportChat={handleExportChat}
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
                          onClick={() => setThemePreference('light')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                            themePreference === 'light'
                              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                          }`}
                        >
                          <Sun size={15} /> Light
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