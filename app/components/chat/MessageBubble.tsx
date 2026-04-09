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

type TableBlock = {
  type: 'table';
  headers: string[];
  rows: string[][];
};

type HeadingBlock = {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
};

type ListBlock = {
  type: 'list';
  ordered: boolean;
  items: string[];
};

type QuoteBlock = {
  type: 'quote';
  text: string;
};

type ParagraphBlock = {
  type: 'paragraph';
  text: string;
};

type MarkdownBlock = TableBlock | HeadingBlock | ListBlock | QuoteBlock | ParagraphBlock;

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const lines = normalized.split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const nextLine = lines[index + 1]?.trim() ?? '';
    if (line.includes('|') && /^\|?[\s:-]+\|[\s|:-]*$/.test(nextLine)) {
      const headers = line.split('|').map((item) => item.trim()).filter(Boolean);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && lines[index].includes('|')) {
        const row = lines[index].split('|').map((item) => item.trim()).filter(Boolean);
        if (row.length > 0) rows.push(row);
        index += 1;
      }

      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (/^>\s+/.test(line)) {
      const quoteLines = [line.replace(/^>\s+/, '')];
      index += 1;
      while (index < lines.length && /^>\s+/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'quote', text: quoteLines.join('\n') });
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*•]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*•]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim()) {
      const current = lines[index].trim();
      if (
        current.includes('|') ||
        /^#{1,3}\s+/.test(current) ||
        /^>\s+/.test(current) ||
        /^[-*•]\s+/.test(current) ||
        /^\d+\.\s+/.test(current)
      ) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n') });
  }

  return blocks;
}

function renderInline(text: string, isUser: boolean) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__)/g).filter(Boolean);

  return tokens.map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={`${token}-${index}`}
          className={`rounded-md px-1.5 py-0.5 text-[0.92em] ${isUser ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      return (
        <strong key={`${token}-${index}`} className={isUser ? 'font-semibold text-white' : 'font-semibold text-slate-900'}>
          {token.slice(2, -2)}
        </strong>
      );
    }

    return highlightContent(token, isUser, index);
  });
}

function highlightContent(content: string, isUser: boolean, offset: number = 0): React.ReactNode {
  const parts = content.split(/(\d+°[Cc]?|[\u4e00-\u9fa5]{2,}(?:市|县|区|镇|乡)|\d+%|评分\s*\d+|推荐|适合|不适合|下雨|晴天|多云|阴天|高铁|自驾|通勤|风险)/g);

  return parts.map((part, index) => {
    const key = `${part}-${offset}-${index}`;
    if (/^\d+°[Cc]?$/.test(part)) {
      return <span key={key} className={isUser ? 'font-semibold text-white' : 'font-semibold text-sky-600'}>{part}</span>;
    }
    if (/^[\u4e00-\u9fa5]{2,}(?:市|县|区|镇|乡)$/.test(part)) {
      return <span key={key} className={isUser ? 'font-semibold text-white' : 'font-medium text-slate-900'}>{part}</span>;
    }
    if (/^\d+%$/.test(part) || /^评分\s*\d+$/.test(part)) {
      return <span key={key} className={isUser ? 'font-semibold text-white' : 'font-medium text-emerald-600'}>{part}</span>;
    }
    if (/^(推荐|适合|不适合|高铁|自驾|通勤|风险)$/.test(part)) {
      return <span key={key} className={isUser ? 'font-semibold text-white' : 'font-semibold text-slate-800'}>{part}</span>;
    }
    return <span key={key}>{part}</span>;
  });
}

function AssistantRichContent({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

  if (blocks.length === 0) {
    return <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{content}</p>;
  }

  return (
    <div className="space-y-3 text-[15px] leading-7 text-slate-700">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const sizeClass = block.level === 1 ? 'text-lg' : block.level === 2 ? 'text-base' : 'text-sm';
          return (
            <h3 key={`heading-${index}`} className={`${sizeClass} font-semibold tracking-tight text-slate-900`}>
              {renderInline(block.text, false)}
            </h3>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={`list-${index}`}
              className={`space-y-2 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-sky-500`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`item-${itemIndex}`} className="text-slate-700">
                  {renderInline(item, false)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'quote') {
          return (
            <div key={`quote-${index}`} className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-slate-700">
              {block.text.split('\n').map((line, lineIndex) => (
                <p key={`quote-line-${lineIndex}`}>{renderInline(line, false)}</p>
              ))}
            </div>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={`table-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {block.headers.map((header, headerIndex) => (
                        <th key={`header-${headerIndex}`} className="px-4 py-3 font-semibold">
                          {renderInline(header, false)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={`row-${rowIndex}`} className="border-t border-slate-100">
                        {row.map((cell, cellIndex) => (
                          <td key={`cell-${rowIndex}-${cellIndex}`} className="px-4 py-3 text-slate-700">
                            {renderInline(cell, false)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        return (
          <p key={`paragraph-${index}`} className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
            {renderInline(block.text, false)}
          </p>
        );
      })}
    </div>
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-2.5 sm:gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl ${isUser ? 'bg-sky-100' : 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-200/80'}`}>
        {isUser ? (
          <User className="h-4 w-4 text-sky-700" />
        ) : (
          <Sparkles className="h-4 w-4 text-white" />
        )}
      </div>

      <div className={`relative max-w-[88%] sm:max-w-[78%] lg:max-w-[74%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-[26px] px-4 py-3.5 shadow-sm ${
            isUser
              ? 'rounded-br-lg bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_52%,#1d4ed8_100%)] text-white shadow-[0_18px_45px_rgba(37,99,235,0.22)]'
              : 'rounded-bl-lg border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] text-slate-800 shadow-[0_18px_45px_rgba(148,163,184,0.14)]'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-7">{renderInline(message.content, true)}</p>
          ) : (
            <AssistantRichContent content={message.content} />
          )}
        </div>

        <div
          className={`absolute bottom-0 h-3 w-3 ${
            isUser
              ? 'right-0 translate-x-[22%] bg-blue-700'
              : 'left-0 -translate-x-[22%] border-l border-b border-white/70 bg-white'
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
