'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { AlertCircle, Sparkles, MapPin, Umbrella, Sun } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import type { TripPlanResult, WeatherData } from '@/types';

interface Config {
  provider: string;
  model: string;
  apiKey: string;
  baseURL?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

const EXAMPLE_PROMPTS = [
  { icon: MapPin, text: '这周六上海出发' },
  { icon: Umbrella, text: '明天周边哪里不下雨' },
  { icon: Sun, text: '下周日适合去哪玩' },
];

interface ChatContainerProps {
  onWeatherUpdate?: (data: WeatherData[]) => void;
  onPlanUpdate?: (plan: TripPlanResult | null) => void;
  queuedPrompt?: { id: number; text: string } | null;
  onQueuedPromptHandled?: () => void;
}

type PlanTripToolPart = {
  type: 'tool-plan_trip';
  toolCallId: string;
  state: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
};

function extractLatestPlan(messages: UIMessage[]): TripPlanResult | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant') continue;
    for (const part of msg.parts) {
      if (part.type === 'tool-plan_trip') {
        const toolPart = part as PlanTripToolPart;
        if (toolPart.state === 'output-available' && toolPart.output) {
          const output = toolPart.output as Record<string, unknown>;
          if (
            typeof output.origin === 'string' &&
            typeof output.date === 'string' &&
            Array.isArray(output.cities)
          ) {
            return output as unknown as TripPlanResult;
          }
        }
      }
    }
  }
  return null;
}

function extractLatestStreamError(messages: UIMessage[]): string | null {
  const lastMessage = messages.at(-1);
  if (!lastMessage || lastMessage.role !== 'assistant') return null;

  for (const part of lastMessage.parts as Array<{ type?: string; errorText?: string }>) {
    if (part.type === 'error' && typeof part.errorText === 'string' && part.errorText.trim()) {
      return part.errorText.trim();
      }
  }

  return null;
}

function ChatSession({
  config,
  onWeatherUpdate,
  onPlanUpdate,
  queuedPrompt,
  onQueuedPromptHandled,
}: ChatContainerProps & { config: Config | null }) {
  const [input, setInput] = useState('');
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [streamErrorText, setStreamErrorText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastWeatherUpdateRef = useRef<string>('');

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: config || undefined,
    }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleWeatherExtract = useCallback((msgs: UIMessage[]) => {
    const plan = extractLatestPlan(msgs);
    onPlanUpdate?.(plan);

    const data = plan?.cities;
    if (Array.isArray(data) && data.length > 0) {
      const key = data.map(d => `${d.city}-${d.score}`).join('|');
      if (key !== lastWeatherUpdateRef.current) {
        lastWeatherUpdateRef.current = key;
        onWeatherUpdate?.(data);
      }
      return;
    }

    lastWeatherUpdateRef.current = '';
    onWeatherUpdate?.([]);
  }, [onPlanUpdate, onWeatherUpdate]);

  useEffect(() => {
    handleWeatherExtract(messages);
  }, [messages, handleWeatherExtract]);

  useEffect(() => {
    if (!queuedPrompt || isLoading) return;

    clearError();
    setStreamErrorText(null);
    setPendingUserText(queuedPrompt.text);
    sendMessage({ text: queuedPrompt.text });
    onQueuedPromptHandled?.();
  }, [clearError, isLoading, onQueuedPromptHandled, queuedPrompt, sendMessage]);

  useEffect(() => {
    const latestStreamError = extractLatestStreamError(messages);
    if (latestStreamError) {
      setStreamErrorText(latestStreamError);
      return;
    }

    if (status === 'ready') {
      setStreamErrorText(null);
    }
  }, [messages, status]);

  useEffect(() => {
    if (!pendingUserText) return;

    const hasUserMessage = messages.some((message) => {
      if (message.role !== 'user') return false;
      return message.parts.some((part) => part.type === 'text' && part.text === pendingUserText);
    });

    if (hasUserMessage || status === 'ready' || status === 'error') {
      setPendingUserText(null);
    }
  }, [messages, pendingUserText, status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      clearError();
      setStreamErrorText(null);
      setPendingUserText(input.trim());
      sendMessage({ text: input });
      setInput('');
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handlePromptClick = (text: string) => {
    clearError();
    setStreamErrorText(null);
    setPendingUserText(text);
    sendMessage({ text });
  };

  const visibleErrorMessage = error?.message || streamErrorText;

  return (
    <div className="glass flex flex-col h-full overflow-hidden rounded-2xl border border-white/40 shadow-xl backdrop-blur-xl bg-white/70">
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
        {messages.length === 0 && !pendingUserText && !error ? (
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
            {pendingUserText && messages.length === 0 && (
              <MessageBubble
                message={{
                  id: 'pending-user',
                  role: 'user',
                  content: pendingUserText,
                }}
              />
            )}
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
            {visibleErrorMessage && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-left text-sm text-rose-700 shadow-sm">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-rose-100">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">本次对话没有成功返回</p>
                  <p className="mt-1 leading-6">
                    {visibleErrorMessage || '服务暂时不可用，请稍后再试。'}
                  </p>
                </div>
              </div>
            )}
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

export default function ChatContainer({
  onWeatherUpdate,
  onPlanUpdate,
  queuedPrompt,
  onQueuedPromptHandled,
}: ChatContainerProps) {
  const [config, setConfig] = React.useState<Config | null>(null);
  const [isConfigReady, setIsConfigReady] = React.useState(false);

  useEffect(() => {
    const loadConfig = () => {
      const savedConfig = localStorage.getItem('ai_config');
      if (!savedConfig) {
        setConfig(null);
        setIsConfigReady(true);
        return;
      }

      try {
        setConfig(JSON.parse(savedConfig));
      } catch {
        setConfig(null);
      }
      setIsConfigReady(true);
    };

    loadConfig();
    window.addEventListener('ai-config-updated', loadConfig);
    return () => window.removeEventListener('ai-config-updated', loadConfig);
  }, []);

  if (!isConfigReady) {
    return (
      <div className="glass flex h-full items-center justify-center overflow-hidden rounded-2xl border border-white/40 shadow-xl backdrop-blur-xl bg-white/70">
        <div className="text-center text-gray-500">
          <p className="text-sm font-medium">正在准备对话环境</p>
          <p className="mt-1 text-xs text-gray-400">加载模型配置与聊天会话</p>
        </div>
      </div>
    );
  }

  return (
    <ChatSession
      key={JSON.stringify(config)}
      config={config}
      onWeatherUpdate={onWeatherUpdate}
      onPlanUpdate={onPlanUpdate}
      queuedPrompt={queuedPrompt}
      onQueuedPromptHandled={onQueuedPromptHandled}
    />
  );
}
