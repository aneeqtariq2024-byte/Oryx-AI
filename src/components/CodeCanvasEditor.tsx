'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Maximize2,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface CodeCanvasEditorProps {
  initialCode: string;
  language?: string;
  title?: string;
}

export default function CodeCanvasEditor({
  initialCode,
  language = 'HTML',
}: CodeCanvasEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    setActiveTab('preview');
    setIframeKey((prev) => prev + 1);
  };

  const getExecutableDoc = (rawCode: string) => {
    if (rawCode.includes('<html') || rawCode.includes('<!DOCTYPE') || rawCode.includes('<body')) {
      return rawCode;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 1rem; background-color: #ffffff; color: #09090b; }
  </style>
</head>
<body>
  ${rawCode}
</body>
</html>`;
  };

  const formattedLang = (language || 'HTML').toUpperCase();

  return (
    <div className="w-full my-4 rounded-[22px] bg-[#161616] border border-[#2a2a2a] overflow-hidden shadow-2xl select-none font-sans">
      {/* Reference Screenshot Header Bar */}
      <div className="px-5 py-3.5 bg-[#161616] flex items-center justify-between gap-3 border-b border-[#242424]">
        {/* Left: Document Icon & Uppercase Title */}
        <div className="flex items-center gap-2.5 text-white">
          <div className="p-1 rounded-md text-zinc-300">
            <FileCode size={18} className="text-zinc-200" />
          </div>
          <span className="text-sm font-bold tracking-wider uppercase text-white font-mono">
            {formattedLang}
          </span>
        </div>

        {/* Right: Circular Icon Group </>, ▷, Copy, Viewport */}
        <div className="flex items-center gap-2">
          {/* Code Mode Button </ > */}
          <button
            onClick={() => setActiveTab('code')}
            title="Show Code"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'code'
                ? 'bg-[#282828] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-[#202020]'
            }`}
          >
            <Code2 size={16} />
          </button>

          {/* Play / Run Button ▷ */}
          <button
            onClick={handleRun}
            title="Run Preview"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'preview'
                ? 'bg-white text-black shadow-lg'
                : 'text-zinc-300 hover:text-white hover:bg-[#202020] border border-zinc-700/50'
            }`}
          >
            <Play size={15} className="fill-current translate-x-0.5" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="Copy Code"
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#202020] transition-colors"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>

          {/* Device Viewport Toggle (Desktop vs Mobile) */}
          <button
            onClick={() => {
              if (activeTab !== 'preview') setActiveTab('preview');
              setViewportMode(viewportMode === 'desktop' ? 'mobile' : 'desktop');
            }}
            title={viewportMode === 'desktop' ? 'Switch to Mobile View' : 'Switch to Desktop View'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              viewportMode === 'mobile' && activeTab === 'preview'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-[#202020]'
            }`}
          >
            {viewportMode === 'desktop' ? <Smartphone size={16} /> : <Monitor size={16} />}
          </button>
        </div>
      </div>

      {/* Body Section */}
      <div className="relative min-h-[380px] max-h-[580px] flex overflow-hidden bg-[#161616]">
        {/* Code Editor Tab (Default - Matching Reference Image 1) */}
        {activeTab === 'code' && (
          <div className="flex-1 flex overflow-hidden font-mono text-xs w-full bg-[#161616] p-4 text-zinc-200">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none font-mono text-xs md:text-sm leading-relaxed custom-scrollbar selection:bg-indigo-500/40 select-text border-none"
            />
          </div>
        )}

        {/* Live Preview Tab (Matching Reference Image 2) */}
        {activeTab === 'preview' && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#111111] overflow-auto custom-scrollbar w-full">
            <div
              className={`w-full transition-all duration-300 ease-in-out flex flex-col items-center justify-center ${
                viewportMode === 'mobile'
                  ? 'w-[375px] h-[520px] rounded-[28px] border-4 border-zinc-700 shadow-2xl overflow-hidden bg-white relative my-auto'
                  : 'w-full h-[490px] rounded-xl border border-zinc-800 bg-white overflow-hidden'
              }`}
            >
              <iframe
                key={iframeKey}
                title="Live Application Output"
                srcDoc={getExecutableDoc(code)}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                className="w-full flex-1 border-none bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
