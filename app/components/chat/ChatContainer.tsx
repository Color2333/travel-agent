'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { AlertCircle, Sparkles, MapPin, Umbrella, Sun } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import type { TripPlanResult, WeatherData } from '@/types';
import { stage } from '@/lib/ui/stage';

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
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.role !== 'assistant') continue;

    for (const part of msg.parts) {
      if (part.type !== 'tool-plan_trip') continue;

      const toolPart = part as PlanTripToolPart;
      if (toolPart.state !== 'output-available' || !toolPart.output) continue;

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
      const key = data.map((item) => `${item.city}-${item.score}`).join('|');
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
  }, [messages.length, pendingUserText, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    clearError();
    setStreamErrorText(null);
    setPendingUserText(text);
    sendMessage({ text });
    setInput('');
  };

  const handlePromptClick = (text: string) => {
    clearError();
    setStreamErrorText(null);
    setPendingUserText(text);
    sendMessage({ text });
  };

  const visibleErrorMessage = error?.message || streamErrorText;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className={stage.subpanel('mx-3 mt-3 rounded-[24px] px-4 py-3 text-white sm:mx-4')}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/58">Conversation</div>
            <p className="mt-1 text-sm leading-6 text-white/82">
              用一句自然语言描述出发地、时间和偏好，地图、卡片和决策台会同步更新。
            </p>
          </div>
          <div className={stage.pill('rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70')}>
            {messages.length > 0 ? `${messages.length} Msgs` : 'Ready'}
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-3 pb-3 pt-4 sm:px-4">
        {messages.length === 0 && !pendingUserText && !visibleErrorMessage ? (
          <div className="flex h-full flex-col justify-center px-2 pb-6 pt-2">
            <div className={stage.subpanel('relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[24px]')}>
              <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_60%)]" />
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(125,211,252,0.82),rgba(59,130,246,0.9))] shadow-[0_14px_36px_rgba(59,130,246,0.32)]">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>

            <div className="mx-auto max-w-sm text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                把地图当成主舞台来问
              </h2>
              <p className="mt-2 text-sm leading-7 text-white/70 sm:text-base">
                AI 负责压缩信息、参与判断并把结果投射到地图上，不需要冗长对话。
              </p>
            </div>

            <div className="mt-6 grid gap-2.5">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.text}
                  type="button"
                  onClick={() => handlePromptClick(prompt.text)}
                  className={stage.subpanel('flex items-center justify-between rounded-[22px] px-4 py-3 text-left text-white/86 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/16')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/14">
                      <prompt.icon className="h-4 w-4 text-sky-200" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{prompt.text}</div>
                      <div className="text-xs text-white/52">直接驱动地图、卡片与决策结果</div>
                    </div>
                  </div>
                  <span className="text-white/40">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-2">
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
              <div className={stage.subpanel('flex items-start gap-3 rounded-[24px] px-4 py-3 text-left text-sm text-white/82')}>
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rose-400/20 text-rose-100">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">这轮对话没有成功完成</p>
                  <p className="mt-1 leading-6 text-white/68">
                    {visibleErrorMessage || '服务暂时不可用，请稍后再试。'}
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className={stage.pill('flex items-center gap-3 self-start rounded-full px-4 py-2 text-white/74')}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(125,211,252,0.6),rgba(59,130,246,0.82))] shadow-[0_10px_24px_rgba(59,130,246,0.24)]">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-sky-200" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-sky-200" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-sky-200" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">AI 正在组织这一轮建议</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        input={input}
        onChange={setInput}
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
      <div className="flex h-full items-center justify-center px-4 py-6">
        <div className={stage.subpanel('rounded-[24px] px-5 py-4 text-center text-white/72')}>
          <p className="text-sm font-medium text-white">正在准备对话环境</p>
          <p className="mt-1 text-xs text-white/54">加载模型配置与聊天会话</p>
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
