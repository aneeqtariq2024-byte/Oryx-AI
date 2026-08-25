'use client';

import React, { useRef, useEffect, useState, memo } from 'react';
import { ChatMessage } from '@/types/chat';
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, User, Crown, Zap, Download, Pencil, ArrowDown } from 'lucide-react';
import CodeCanvasEditor from './CodeCanvasEditor';
import MarkdownRenderer from './MarkdownRenderer';
import OryxLogo from './OryxLogo';

interface ChatCanvasProps {
  messages: ChatMessage[];
  onRegenerate?: () => void;
  onEditMessage?: (msg: ChatMessage) => void;
}

// ── Image card: shimmer + spinner while Pollinations renders, then the image ──
function ImageCard({ url, prompt }: { url: string; prompt?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="w-full max-w-md rounded-2xl overflow-hidden border border-white/10 bg-[#2a2a2a] shadow-2xl msg-in">
      <div className="relative aspect-square bg-[#262626]">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-white/10 border-t-emerald-400 animate-spin" />
            <p className="text-xs text-[#afafaf]">Generating image…</p>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-white/[0.05] animate-pulse" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={prompt || 'Generated image'}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
      <div className="p-3 flex items-center justify-between gap-3 border-t border-white/5">
        <p className="text-xs text-[#afafaf] italic truncate flex-1">&ldquo;{prompt || 'generated image'}&rdquo;</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[11px] font-semibold rounded-lg hover:bg-white/90 transition-colors"
        >
          <Download size={12} /> Download
        </a>
      </div>
    </div>
  );
}

// ── Task mode badge: shows what the Boss Agent detected for this message ──
const TASK_MODE_STYLES: Record<string, { icon: string; color: string }> = {
  'Image Generation': { icon: '🖼️', color: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/25' },
  'Research & Information Search': { icon: '🔍', color: 'bg-blue-500/10 text-blue-300 border-blue-500/25' },
  'Coding & Debugging': { icon: '💻', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' },
  'Website & UI Building': { icon: '🌐', color: 'bg-sky-500/10 text-sky-300 border-sky-500/25' },
  'Suggestions & Recommendations': { icon: '💡', color: 'bg-amber-500/10 text-amber-300 border-amber-500/25' },
  'Deep Reasoning & Analysis': { icon: '🧠', color: 'bg-purple-500/10 text-purple-300 border-purple-500/25' },
  'Professional Writing': { icon: '✍️', color: 'bg-rose-500/10 text-rose-300 border-rose-500/25' },
  'Long Document Processing': { icon: '📄', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25' },
  'General Conversation': { icon: '💬', color: 'bg-white/5 text-zinc-300 border-white/15' },
};

function TaskModeBadge({ mode }: { mode: string }) {
  const style = TASK_MODE_STYLES[mode] || { icon: '⚡', color: 'bg-white/5 text-zinc-300 border-white/15' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border rounded-full px-2.5 py-0.5 ${style.color}`}>
      <span>{style.icon}</span>
      <span>{mode}</span>
    </span>
  );
}

// ── One chat row. Memoized so streaming updates only re-render the growing message ──
const MessageRow = memo(function MessageRow({
  msg,
  isLast,
  onRegenerate,
  copied,
  onCopy,
  onEdit,
}: {
  msg: ChatMessage;
  isLast: boolean;
  onRegenerate?: () => void;
  copied: boolean;
  onCopy: (text: string, id: string) => void;
  onEdit?: (msg: ChatMessage) => void;
}) {
  const isUser = msg.role === 'user';
  const parsedParts = !isUser && !msg.isThinking ? parseMessageContent(msg.content) : [];

  return (
    <div key={msg.id} className={`msg-in flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#303030] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <OryxLogo size={18} />
        </div>
      )}

      <div className={`relative flex flex-col min-w-0 ${isUser ? 'items-end max-w-[85%]' : 'items-start flex-1'}`}>
        {!isUser && !msg.isThinking && msg.taskMode && (
          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
            <TaskModeBadge mode={msg.taskMode} />
          </div>
        )}
        <div
          className={
            isUser
              ? 'px-4 py-2.5 rounded-3xl rounded-br-lg bg-[#303030] text-[#ececec] text-[15px] leading-relaxed whitespace-pre-wrap'
              : 'text-[#ececec] text-[15px] leading-relaxed w-full'
          }
        >
          {msg.isThinking ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-[#afafaf]">
              <div className="flex items-center gap-1">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#afafaf] inline-block" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#afafaf] inline-block" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#afafaf] inline-block" />
              </div>
              <span className="text-xs flex items-center gap-1.5">
                {msg.taskMode ? (
                  <>
                    <span>{(TASK_MODE_STYLES[msg.taskMode] || {}).icon || '⚡'}</span>
                    <span className="text-[#ececec] font-medium">{msg.taskMode}</span>
                  </>
                ) : (
                  'Boss Agent reading your prompt…'
                )}
              </span>
            </div>
          ) : isUser ? (
            msg.content
          ) : msg.type === 'image' ? (
            msg.imageUrl ? (
              <ImageCard url={msg.imageUrl} prompt={msg.imagePrompt} />
            ) : (
              <iframe
                srcDoc={msg.content}
                className="w-full border border-white/10 rounded-xl bg-[#2a2a2a]"
                style={{ minHeight: '280px', maxHeight: '500px' }}
                sandbox="allow-same-origin allow-scripts"
                title="Generated Image"
              />
            )
          ) : parsedParts.length > 0 ? (
            <div className="space-y-3.5 w-full">
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
            <div className="stream-cursor">
              <MarkdownRenderer content={msg.content} />
            </div>
          )}
        </div>

        {/* Message Actions */}
        {!msg.isThinking && (
          <div
            className={`flex items-center gap-1 mt-1.5 text-[#8f8f8f] transition-opacity duration-200 ${
              isUser ? 'opacity-0 group-hover:opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
            }`}
          >
            <button
              onClick={() => onCopy(msg.content, msg.id)}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#ececec] transition-colors"
              title="Copy"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
            {isUser && onEdit && (
              <button
                onClick={() => onEdit(msg)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#ececec] transition-colors"
                title="Edit message"
              >
                <Pencil size={13} />
              </button>
            )}
            {!isUser && (
              <>
                {onRegenerate && isLast && (
                  <button
                    onClick={onRegenerate}
                    className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#ececec] transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
                <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#ececec] transition-colors" title="Good response">
                  <ThumbsUp size={14} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#ececec] transition-colors" title="Bad response">
                  <ThumbsDown size={14} />
                </button>
                <span className="text-[10px] ml-1 tabular-nums">{msg.timestamp}</span>
              </>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/10 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
          <User size={15} />
        </div>
      )}
    </div>
  );
});

function parseMessageContent(content: string) {
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
}

export default function ChatCanvas({ messages, onRegenerate, onEditMessage }: ChatCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Track whether the user is near the bottom — skip auto-scroll when they scrolled up to read
  const isNearBottom = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    isNearBottom.current = nearBottom;
    setShowScrollBtn(!nearBottom && el.scrollHeight > el.clientHeight + 200);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el && isNearBottom.current) {
      // Instant jump, not smooth — smooth on every stream chunk causes visible jank
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 md:px-6 py-6 space-y-7 max-w-3xl mx-auto w-full custom-scrollbar"
      >
        {messages.map((msg, index) => (
          <MessageRow
            key={msg.id || `msg-${index}`}
            msg={msg}
            isLast={index === messages.length - 1}
            onRegenerate={onRegenerate}
            copied={copiedId === (msg.id || `msg-${index}`)}
            onCopy={handleCopy}
            onEdit={onEditMessage}
          />
        ))}
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-[#303030] border border-white/15 text-[#ececec] shadow-xl hover:bg-[#3a3a3a] transition-all z-10 scroll-btn"
          title="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
}
