'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="glass flex h-[600px] flex-col overflow-hidden rounded-2xl">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-semibold text-gray-800">👋 嗨！想去哪里玩？</h2>
            <p className="mt-2 text-gray-500">告诉我你想去的地方，我会帮你规划行程</p>
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
              <div className="flex items-center gap-2 text-gray-500 animate-slide-up">
                <span className="text-xl">🤔</span>
                <span className="text-sm">正在思考...</span>
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
