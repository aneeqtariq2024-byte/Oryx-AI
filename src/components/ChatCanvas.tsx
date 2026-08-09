'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from '@/types/chat';
import { Sparkles, User, Copy, Check } from 'lucide-react';
import CodeCanvasEditor from './CodeCanvasEditor';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatCanvasProps {
  messages: ChatMessage[];
}

export default function ChatCanvas({ messages }: ChatCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parseMessageContent = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'html',
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts;
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full custom-scrollbar">
      {messages.map((msg, index) => {
        const msgId = msg.id || `msg-${index}`;
        const isUser = msg.role === 'user';
        const parsedParts = !isUser && !msg.isThinking ? parseMessageContent(msg.content) : [];

        return (
          <motion.div
            key={msgId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} group`}
          >
            {!isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-white shadow-md shrink-0 mt-1">
                <Sparkles size={16} />
              </div>
            )}

            <div className={`relative max-w-[92%] md:max-w-[88%] flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
              <div
                className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed w-full transition-all ${
                  isUser
                    ? 'bg-zinc-800/90 dark:bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 rounded-tr-sm shadow-md max-w-fit'
                    : 'bg-zinc-900/60 dark:bg-zinc-900/60 text-zinc-200 border border-zinc-800/80 rounded-tl-sm backdrop-blur-md shadow-sm'
                }`}
              >
                {msg.isThinking ? (
                  <div className="flex items-center gap-2.5 text-zinc-400 text-xs font-medium py-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                    <span>Oryx AI neural inference active...</span>
                  </div>
                ) : isUser ? (
                  <div className="whitespace-pre-wrap font-normal selection:bg-indigo-500/30 selection:text-white">
                    {msg.content}
                  </div>
                ) : parsedParts.length > 0 ? (
                  <div className="space-y-3 w-full">
                    {parsedParts.map((part, pIdx) => {
                      if (part.type === 'code') {
                        return (
                          <CodeCanvasEditor
                            key={pIdx}
                            initialCode={part.content}
                            language={part.language}
                            title="Interactive App & Live Preview"
                          />
                        );
                      }
                      return <MarkdownRenderer key={pIdx} content={part.content} />;
                    })}
                  </div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>

              {/* Message Actions */}
              {!msg.isThinking && !isUser && (
                <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1">
                  <button
                    onClick={() => handleCopy(msg.content, msgId)}
                    className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800/60"
                    title="Copy response"
                  >
                    {copiedId === msgId ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {isUser && (
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0 mt-1 shadow-sm">
                <User size={16} className="text-zinc-300" />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}