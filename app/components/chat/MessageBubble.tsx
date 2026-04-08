'use client';

import React from 'react';
import { User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: string;
  content: string;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-end gap-2 sm:gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-primary-100' : 'bg-gradient-to-br from-primary-400 to-primary-600'}`}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-600" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`relative max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md'
              : 'bg-white/90 border border-gray-200/60 text-gray-800 rounded-bl-md'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed" style={{ lineHeight: '1.7' }}>
            {highlightContent(message.content)}
          </p>
        </div>

        <div
          className={`absolute bottom-0 w-3 h-3 ${
            isUser
              ? 'right-0 translate-x-1/4 bg-primary-600 clip-triangle-right'
              : 'left-0 -translate-x-1/4 bg-white border-l border-b border-gray-200/60 clip-triangle-left'
          }`}
          style={{
            clipPath: isUser
              ? 'polygon(0 0, 0% 100%, 100% 100%)'
              : 'polygon(0 100%, 100% 0, 100% 100%)',
          }}
        />
      </div>
    </div>
  );
}

function highlightContent(content: string): React.ReactNode {
  const parts = content.split(/(\d+°[Cc]|[\u4e00-\u9fa5]{2,}(?:市|县|区|镇|乡)|\d+%|评分\s*\d+|推荐|适合|不适合|下雨|晴天|多云|阴天)/g);

  return parts.map((part, index) => {
    const key = `${part}-${index}`;
    if (/^\d+°[Cc]$/.test(part)) {
      return (
        <span key={key} className="font-semibold text-primary-300">
          {part}
        </span>
      );
    }
    if (/^[\u4e00-\u9fa5]{2,}(?:市|县|区|镇|乡)$/.test(part)) {
      return (
        <span key={key} className="font-medium text-primary-200">
          {part}
        </span>
      );
    }
    if (/^\d+%$/.test(part) || /^评分\s*\d+$/.test(part)) {
      return (
        <span key={key} className="font-medium text-blue-200">
          {part}
        </span>
      );
    }
    if (/^(推荐|适合|不适合)$/.test(part)) {
      return (
        <span key={key} className="font-semibold">
          {part}
        </span>
      );
    }
    if (/^(下雨|晴天|多云|阴天)$/.test(part)) {
      return (
        <span key={key} className="italic">
          {part}
        </span>
      );
    }
    return <span key={key}>{part}</span>;
  });
}
