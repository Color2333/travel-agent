'use client';

import React from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function ChatInput({ input, onChange, onSubmit, isLoading }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex border-t border-gray-200 p-4">
      <input
        type="text"
        value={input}
        onChange={onChange}
        placeholder="输入消息..."
        disabled={isLoading}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="ml-3 flex items-center gap-2 bg-primary-600 px-4 py-2 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
