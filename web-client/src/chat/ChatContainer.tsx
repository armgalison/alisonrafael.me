'use client';

import { useState } from 'react';
import { ChatIcon } from './components/ChatIcon';
import { ChatWidget } from './components/ChatWidget';
import { useChat } from './useChat';

export function ChatContainer() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isStreaming, error, isLoading, sendMessage } = useChat();

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
