'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react';
import { ArrowRight } from 'lucide-react';
import { Corners } from '../../components/home/Corners';
import type { Message } from '../useChat';

interface HeroChatProps {
  messages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  panelRef?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;
}

const suggestedQuestions = [
  "What's your current role?",
  "What's your tech stack?",
  'Biggest performance win?',
  'How can I contact you?',
];

export function HeroChat({ messages, isStreaming, isLoading, error, onSendMessage, panelRef, inputRef }: HeroChatProps) {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const busy = isStreaming || isLoading;
  const awaitingFirstToken = isStreaming && messages.at(-1)?.role === 'user';
  const showList = messages.length > 0 || awaitingFirstToken || Boolean(error);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, awaitingFirstToken, error]);

  const ask = (text: string) => {
    if (!text.trim() || busy) return;
    onSendMessage(text.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ask(input);
    }
  };

  return (
    <div ref={panelRef} className="blueprint mt-2 flex flex-col gap-3 p-4">
      <Corners />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label-accent">Ask my AI assistant</span>
        <span className="flex items-center gap-1.5 text-xs opacity-65">
          <span className="size-[7px] rounded-full bg-(--ind-accent)" />
          Online · answers from my resume
        </span>
      </div>

      {showList && (
        <div ref={listRef} className="flex max-h-[220px] flex-col gap-2.5 overflow-auto p-0.5" aria-live="polite">
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <div
                key={msg.id}
                className="max-w-[80%] self-end border border-(--ind-accent) px-3 py-2 text-sm leading-[1.45] break-words text-(--ind-accent-800)"
              >
                {msg.content}
              </div>
            ) : (
              <div
                key={msg.id}
                className="max-w-[88%] self-start border border-(--ind-divider) px-3 py-2 text-sm leading-normal break-words whitespace-pre-wrap"
              >
                {msg.content}
              </div>
            ),
          )}
          {awaitingFirstToken && (
            <div className="flex gap-1 self-start border border-(--ind-divider) px-3 py-3" aria-label="Assistant is typing">
              {[0, 1, 2].map((i) => (
                <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          )}
          {error && !isStreaming && (
            <div className="max-w-[88%] self-start border border-(--ind-divider) px-3 py-2 text-sm leading-normal">
              Sorry, something went wrong. Please try again.
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="input min-h-11 min-w-0 flex-1 text-[15px]!"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about my work, stack or experience…"
          aria-label="Ask my AI assistant"
        />
        <button
          type="button"
          className="btn btn-primary blueprint min-h-11 px-[18px] text-[15px]!"
          onClick={() => ask(input)}
          disabled={busy}
        >
          <Corners />
          Ask
          <ArrowRight width={16} height={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestedQuestions.map((question) => (
          <button
            key={question}
            type="button"
            className="btn btn-secondary min-h-8 px-2.5 text-[13px]!"
            onClick={() => ask(question)}
            disabled={busy}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
