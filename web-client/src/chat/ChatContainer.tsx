'use client';

import { useState, useEffect } from 'react';
import { ChatIcon } from './components/ChatIcon';
import { ChatWidget } from './components/ChatWidget';
import { useChat } from './useChat';

export function ChatContainer() {
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
