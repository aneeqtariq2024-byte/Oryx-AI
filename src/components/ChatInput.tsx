'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUp, Mic, Square, ImagePlus } from 'lucide-react';

interface ChatInputProps {
  prompt: string;
  setPrompt: (val: string) => void;
  onSend: () => void;
  isGenerating?: boolean;
  onStop?: () => void;
  imageMode?: boolean;
  setImageMode?: (v: boolean) => void;
}

export default function ChatInput({ prompt, setPrompt, onSend, isGenerating, onStop, imageMode, setImageMode }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const speechSupported =
    typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating) onSend();
    }
  };

  // ---- Voice input (Web Speech API) ----
  const toggleVoice = () => {
    if (!speechSupported) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'en-US';
    recognition.continuous = false; // continuous can be buggy on some browsers, false makes it stop after a sentence
    recognition.interimResults = false;
    
    // Store the current prompt at start so we can append to it
    const startPrompt = prompt;
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const newText = (startPrompt ? startPrompt + ' ' : '') + finalTranscript.trim();
        setPrompt(newText);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e);
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    textareaRef.current?.focus();
  };

  return (
    <div className="pb-4 md:pb-6 pt-2 px-3 md:px-6 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent z-20 sticky bottom-0">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-[#303030] border border-white/10 rounded-[26px] p-2.5 pl-3 shadow-2xl flex items-end gap-2 transition-all duration-200 focus-within:border-white/20 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_40px_-10px_rgba(99,102,241,0.35)]">
          <button
            onClick={() => setImageMode && setImageMode(!imageMode)}
            className={`p-2 mb-0.5 rounded-full shrink-0 transition-all ${
              imageMode
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-[#afafaf] hover:text-white hover:bg-white/10'
            }`}
            title={imageMode ? 'Image mode ON — every prompt becomes an image. Click to switch back to chat' : 'Image mode — generate images from any prompt'}
          >
            <ImagePlus size={19} />
          </button>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening… speak now'
                : imageMode
                ? 'Describe the image to generate — e.g. “a girl standing in rain, neon city”…'
                : 'Message Oryx AI…'
            }
            rows={1}
            className="flex-1 bg-transparent text-[#ececec] placeholder-[#8f8f8f] text-[15px] focus:outline-none resize-none py-2 px-1 max-h-[200px] leading-relaxed custom-scrollbar"
          />

          {speechSupported && (
            <button
              onClick={toggleVoice}
              className={`p-2.5 mb-0.5 rounded-full shrink-0 transition-all ${
                isListening
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 voice-pulse'
                  : 'text-[#afafaf] hover:text-white hover:bg-white/10'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              <Mic size={18} />
            </button>
          )}

          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.button
                key="stop"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={onStop}
                className="p-2.5 rounded-full bg-white text-black hover:bg-white/90 transition-colors shadow-lg mb-0.5 shrink-0"
                title="Stop generating"
              >
                <Square size={16} className="stroke-[2.5] fill-current" />
              </motion.button>
            ) : prompt.trim().length > 0 ? (
              <motion.button
                key="send"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={onSend}
                className={`p-2.5 rounded-full shadow-lg mb-0.5 shrink-0 transition-colors ${
                  imageMode
                    ? 'bg-gradient-to-tr from-purple-500 to-fuchsia-500 text-white hover:from-purple-400 hover:to-fuchsia-400'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
                title={imageMode ? 'Generate image (Enter)' : 'Send (Enter)'}
              >
                <ArrowUp size={18} className="stroke-[2.5]" />
              </motion.button>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="p-2.5 rounded-full bg-white text-black mb-0.5 shrink-0 opacity-90"
              >
                <ArrowUp size={18} className="stroke-[2.5]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-2.5 text-[11px] text-[#8f8f8f] select-none">
          {imageMode ? (
            <span className="text-purple-300/80 font-medium">🖼️ Image mode — Describe anything and an image will be generated</span>
          ) : (
            'Oryx AI can make mistakes. Verify important info.'
          )}
        </div>
      </div>
    </div>
  );
}
