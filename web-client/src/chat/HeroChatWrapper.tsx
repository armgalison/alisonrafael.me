'use client';

import { useEffect, useRef, useState } from 'react';
import { Corners } from '../components/home/Corners';
import { HeroChat } from './components/HeroChat';
import { useChat } from './useChat';

// The resume page's chat: the panel in the hero, plus an "Ask me anything"
// button that appears once the panel has scrolled above the viewport and
// brings the visitor back to it. Replaces the corner ChatContainer on "/".
export function HeroChatWrapper() {
  const { messages, isStreaming, error, isLoading, sendMessage } = useChat();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowFab(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const goToChat = () => {
    const panel = panelRef.current;
    if (!panel) return;
    window.scrollTo({ top: panel.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' });
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 500);
  };

  return (
    <>
      <HeroChat
        messages={messages}
        isStreaming={isStreaming}
        isLoading={isLoading}
        error={error}
        onSendMessage={sendMessage}
        panelRef={panelRef}
        inputRef={inputRef}
      />
      {showFab && (
        <button
          type="button"
          onClick={goToChat}
          className="btn btn-primary blueprint fixed right-6 bottom-6 z-20 min-h-12 px-[18px] text-[15px]! shadow-(--ind-shadow-lg)"
        >
          <Corners />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
          Ask me anything
        </button>
      )}
    </>
  );
}
