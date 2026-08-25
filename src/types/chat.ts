export interface ModelOption {
  id: string;
  name: string;
  description: string;
  speed: string;
  context: string;
  icon: string;
  provider?: 'Claude' | 'Groq' | 'Gemini' | 'OpenRouter' | 'NVIDIA' | 'Ollama';
  isBoss?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isThinking?: boolean;
  modelUsed?: string;
  type?: 'chat' | 'image';
  imageUrl?: string;
  imagePrompt?: string;
  /** Task mode the Boss Agent detected for this message (e.g. "Research & Information Search") */
  taskMode?: string;
  /** Short routing explanation shown under the mode badge */
  routingNote?: string;
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
