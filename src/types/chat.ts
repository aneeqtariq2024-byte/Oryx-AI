export interface ModelOption {
  id: string;
  name: string;
  description: string;
  speed: string;
  context: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  pinned?: boolean;
  folder?: string;
  projectId?: string;
  updatedAt: string;
}

export interface PlusMenuItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}