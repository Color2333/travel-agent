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
  }, []);

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
    <form onSubmit={onSubmit} className="border-t border-gray-200/60 bg-white/50 backdrop-blur-sm p-3 sm:p-4">
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
            className="w-full min-h-[44px] max-h-[120px] rounded-full border border-gray-300/80 bg-white/90 px-4 py-2.5 pr-12 text-sm sm:text-[15px] placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-all duration-200 shadow-sm"
            style={{ lineHeight: '1.5' }}
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            isDisabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-200 hover:shadow-lg hover:shadow-primary-300 hover:scale-105 active:scale-95'
          }`}
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </form>
  );
}
