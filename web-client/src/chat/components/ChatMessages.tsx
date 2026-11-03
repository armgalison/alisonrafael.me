'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatBubble } from './ChatBubble';
import type { Message } from '../useChat';

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white dark:bg-gray-800"
    >
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Start a conversation! Ask me anything about my background, skills, or experience.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {messages.map((msg, idx) => (
            <ChatBubble key={msg.id} role={msg.role} content={msg.content} index={idx} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
