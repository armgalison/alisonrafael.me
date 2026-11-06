'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChatIcon } from './components/ChatIcon';
import { ChatWidget } from './components/ChatWidget';
import { useChat } from './useChat';

// Not on the resume page ("/"), which has its own chat in the hero
// (HeroChatWrapper), nor on the Blog. On blog.alisonrafael.me usePathname() is
// the rewritten "/blog/..." route, so the prefix check covers both hosts.
// Returning before FloatingChat mounts means no chat session is opened there.
export function ChatContainer() {
  const pathname = usePathname();
  return pathname === '/' || pathname.startsWith('/blog') ? null : <FloatingChat />;
}

function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const { messages, isStreaming, error, isLoading, sendMessage } = useChat();

  // Send "hi" automatically on first open
  useEffect(() => {
    if (isOpen && !hasOpened && messages.length === 0 && !isLoading) {
      setHasOpened(true);
      // Small delay to ensure everything is ready
      setTimeout(() => {
        sendMessage('hi');
      }, 500);
    }
  }, [isOpen, hasOpened, messages.length, isLoading, sendMessage]);

  return (
    <>
      <ChatIcon isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      <ChatWidget
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isStreaming={isStreaming}
        isLoading={isLoading}
        error={error}
        onSendMessage={sendMessage}
      />
    </>
  );
}
