'use client';

import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function ChatInput({ input, onChange, onSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const isDisabled = !input.trim() || isLoading;

  return (
    <form onSubmit={onSubmit} className="border-t border-[var(--panel-divider)] px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
      <div className="relative flex items-end gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={isLoading}
            rows={1}
            className="w-full min-h-[48px] max-h-[120px] rounded-[24px] border border-slate-900/[0.10] bg-slate-900/[0.04] px-4 py-3 pr-12 text-sm panel-t1 placeholder:panel-t4 focus:border-slate-900/[0.18] focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06] disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200 backdrop-blur-xl dark:border-white/16 dark:bg-white/10 dark:placeholder:text-white/38 dark:focus:border-white/28 dark:focus:ring-white/12 sm:text-[15px]"
            style={{ lineHeight: '1.5' }}
          />
        </div>

        <button
          type="submit"
          aria-label="发送消息"
          disabled={isDisabled}
          className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            isDisabled
              ? 'bg-slate-900/[0.06] text-slate-400 cursor-not-allowed dark:bg-white/8 dark:text-white/32'
              : 'bg-[linear-gradient(135deg,rgba(125,211,252,0.86),rgba(59,130,246,0.96))] text-white shadow-[0_16px_34px_rgba(59,130,246,0.32)] hover:scale-[1.03] active:scale-95'
          }`}
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </form>
  );
}
