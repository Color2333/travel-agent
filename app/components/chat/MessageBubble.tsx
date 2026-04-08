'use client';

import React from 'react';

export default function MessageBubble({ message }: { message: { id: string; role: string; content: string } }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-end gap-2 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className="text-xl">{isUser ? '👤' : '🤖'}</div>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-white border border-gray-200 rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
