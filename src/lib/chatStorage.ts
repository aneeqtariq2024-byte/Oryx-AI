// src/lib/chatStorage.ts
// Supabase CRUD for chat sessions and messages (per-user, persistent across devices)

import { supabase } from './supabase';
import { ChatSession, ChatMessage } from '@/types/chat';

// ---- Sessions ----

export async function loadSessionsFromDB(userId: string): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) { 
    console.error('[chatStorage] loadSessions error:', error.message || error.details || error); 
    return []; 
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const r = row as unknown as Record<string, unknown>;
    return {
      id: String(r.id),
      title: String(r.title || ''),
      projectId: (r.project_id as string) || '',
      updatedAt: (r.updated_at as string) || new Date().toISOString(),
      pinned: Boolean(r.pinned),
      archived: Boolean(r.archived),
    } as unknown as ChatSession;
  });
}

export async function upsertSessionToDB(session: ChatSession, userId: string): Promise<void> {
  const sessionRecord = session as unknown as Record<string, unknown>;

  const { error } = await supabase.from('chat_sessions').upsert({
    id: session.id,
    user_id: userId,
    title: session.title,
    project_id: session.projectId || null,
    updated_at: session.updatedAt || new Date().toISOString(),
    pinned: Boolean(sessionRecord.pinned) || false,
    archived: Boolean(sessionRecord.archived) || false,
  }, { onConflict: 'id' });

  if (error) console.error('[chatStorage] upsertSession error:', error.message || error);
}

export async function deleteSessionFromDB(sessionId: string): Promise<void> {
  const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId);
  if (error) console.error('[chatStorage] deleteSession error:', error.message || error);
}

export async function updateSessionInDB(sessionId: string, fields: Partial<{ title: string; pinned: boolean; archived: boolean; updated_at: string; project_id: string | null }>): Promise<void> {
  const { error } = await supabase.from('chat_sessions').update(fields).eq('id', sessionId);
  if (error) console.error('[chatStorage] updateSession error:', error.message || error);
}

// ---- Messages ----

export async function loadMessagesFromDB(sessionId: string, userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) { 
    console.error('[chatStorage] loadMessages error:', error.message || error); 
    return []; 
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const r = row as unknown as Record<string, unknown>;
    return {
      id: String(r.id),
      role: r.role as 'user' | 'assistant',
      content: String(r.content || ''),
      type: (r.type as unknown) || 'chat',
      imageUrl: r.image_url ? String(r.image_url) : undefined,
      modelUsed: r.model_used ? String(r.model_used) : undefined,
      taskMode: r.task_mode ? String(r.task_mode) : undefined,
      timestamp: r.created_at 
        ? new Date(r.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
    } as unknown as ChatMessage;
  });
}

export async function insertMessageToDB(msg: ChatMessage, sessionId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('chat_messages').insert({
    id: msg.id,
    session_id: sessionId,
    user_id: userId,
    role: msg.role,
    content: msg.content,
    type: msg.type || 'chat',
    image_url: msg.imageUrl || null,
    model_used: msg.modelUsed || null,
    task_mode: msg.taskMode || null,
  });
  if (error) console.error('[chatStorage] insertMessage error:', error);
}

export async function deleteMessagesForSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('chat_messages').delete().eq('session_id', sessionId);
  if (error) console.error('[chatStorage] deleteMessages error:', error);
}