'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (!inList || listItems.length === 0) return;
    if (inList === 'ol') {
      elements.push(
        <ol key={`ol-${key}`} className="space-y-2 my-3 pl-1">
          {listItems}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul-${key}`} className="space-y-2 my-3 pl-1">
          {listItems}
        </ul>
      );
    }
    inList = null;
    listItems = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList(`flush-${idx}`);
      elements.push(<div key={`blank-${idx}`} className="h-2" />);
      return;
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      flushList(`flush-${idx}`);
      elements.push(
        <h1 key={idx} className="text-xl md:text-2xl font-bold text-white mt-4 mb-2 tracking-tight">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList(`flush-${idx}`);
      elements.push(
        <h2 key={idx} className="text-lg md:text-xl font-bold text-zinc-100 mt-3.5 mb-2 tracking-tight">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushList(`flush-${idx}`);
      elements.push(
        <h3 key={idx} className="text-base md:text-lg font-semibold text-indigo-300 mt-3 mb-1.5">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('#### ')) {
      flushList(`flush-${idx}`);
      elements.push(
        <h4 key={idx} className="text-sm font-semibold text-zinc-200 mt-2 mb-1">
          {renderInline(trimmed.slice(5))}
        </h4>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList(`flush-${idx}`);
      elements.push(
        <blockquote key={idx} className="border-l-2 border-indigo-500/60 pl-3 py-1 my-2 text-zinc-300 italic bg-indigo-500/5 rounded-r-lg">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList(`flush-${idx}`);
      elements.push(<hr key={idx} className="border-zinc-800 my-4" />);
      return;
    }

    // Ordered list item (1., 2., 10., etc.)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        flushList(`flush-${idx}`);
        inList = 'ol';
      }
      listItems.push(
        <li key={idx} className="flex items-start gap-2.5 text-zinc-200 text-xs md:text-sm leading-relaxed">
          <span className="text-indigo-400 font-semibold text-xs shrink-0 mt-0.5 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            {olMatch[1]}
          </span>
          <div className="flex-1">{renderInline(olMatch[2])}</div>
        </li>
      );
      return;
    }

    // Unordered list item (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inList !== 'ul') {
        flushList(`flush-${idx}`);
        inList = 'ul';
      }
      listItems.push(
        <li key={idx} className="flex items-start gap-2.5 text-zinc-200 text-xs md:text-sm leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2 shadow-sm shadow-indigo-500/50" />
          <div className="flex-1">{renderInline(ulMatch[1])}</div>
        </li>
      );
      return;
    }

    // Normal paragraph line
    flushList(`flush-${idx}`);
    elements.push(
      <p key={idx} className="text-zinc-200 text-xs md:text-sm leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
  });

  flushList('end');

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

function renderInline(text: string): React.ReactNode[] {
  // Regex to split by bold (**text**), italic (*text*), code (`text`), link ([text](url))
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-zinc-300">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Inline Code `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="bg-zinc-800/90 text-indigo-300 px-1.5 py-0.5 rounded text-[12px] font-mono border border-zinc-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
}
