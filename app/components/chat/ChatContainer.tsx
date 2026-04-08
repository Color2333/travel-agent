'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sparkles, MapPin, Umbrella, Sun } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

interface Config {
  provider: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

const EXAMPLE_PROMPTS = [
  { icon: MapPin, text: '这周六上海出发' },
  { icon: Umbrella, text: '明天周边哪里不下雨' },
  { icon: Sun, text: '下周日适合去哪玩' },
];

export default function ChatContainer() {
  const [config, setConfig] = React.useState<Config | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: config || undefined,
    }),
  });

  useEffect(() => {
    if (!hasInitialized.current) {
      const savedConfig = localStorage.getItem('ai_config');
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch {
          setConfig(null);
        }
      }
      hasInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handlePromptClick = (text: string) => {
    sendMessage({ text });
  };

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="glass flex flex-col h-full overflow-hidden rounded-2xl border border-white/40 shadow-xl backdrop-blur-xl bg-white/70">
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-200">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-2 bg-primary-400/20 rounded-3xl blur-xl" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              想去哪里玩？
            </h2>
            <p className="text-gray-500 text-base sm:text-lg mb-8 max-w-xs">
              告诉我你的出发地和日期，我来帮你找好天气
            </p>

            <div className="flex flex-wrap justify-center gap-2.5 max-w-sm">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.text}
                  type="button"
                  onClick={() => handlePromptClick(prompt.text)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/80 border border-gray-200/60 text-sm text-gray-700 hover:bg-white hover:border-primary-300 hover:text-primary-700 hover:shadow-md transition-all duration-200 group"
                >
                  <prompt.icon className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <span>{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message: { id: string; role: string; parts: Array<{ type: string; text?: string }> }) => (
              <MessageBubble
                key={message.id}
                message={{
                  id: message.id,
                  role: message.role,
                  content: message.parts.map((part) => (part.type === 'text' ? part.text : '')).join(''),
                }}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 text-gray-500 animate-slide-up pl-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <ChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
