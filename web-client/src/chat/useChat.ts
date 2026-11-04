'use client';

import { useCallback, useEffect, useState } from 'react';
import { chatApi, ChatStreamEvent } from './api'

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
};

type UseChatState = {
  sessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  isLoading: boolean;
};

const SESSION_STORAGE_KEY = 'chat-session-id';

export function useChat() {
  const [state, setState] = useState<UseChatState>({
    sessionId: null,
    messages: [],
    isStreaming: false,
    error: null,
    isLoading: true,
  });

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        let sessionId = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null;

        // Try to load history from existing session
        if (sessionId) {
          try {
            const history = await chatApi.getHistory(sessionId);
            const messages = history.map((msg, idx) => ({
              id: `msg-${idx}`,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              createdAt: new Date(msg.createdAt),
            }));

            setState((prev) => ({
              ...prev,
              sessionId,
              messages,
              isLoading: false,
              error: null,
            }));
            return;
          } catch (err) {
            // Session failed (expired, deleted, or invalid), clear it and create a new one
            const errorMsg = err instanceof Error ? err.message : '';
            console.warn('Chat session invalid, starting fresh:', errorMsg);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
            sessionId = null;
          }
        }

        // Create new session if none exists or previous one failed
        try {
          const result = await chatApi.createSession();
          sessionId = result.sessionId;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
          }

          setState((prev) => ({
            ...prev,
            sessionId,
            messages: [],
            isLoading: false,
            error: null,
          }));
        } catch (createErr) {
          const message = createErr instanceof Error ? createErr.message : 'Failed to create session';
          setState((prev) => ({
            ...prev,
            error: message,
            isLoading: false,
          }));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize chat';
        setState((prev) => ({
          ...prev,
          error: message,
          isLoading: false,
        }));
      }
    };

    initSession();
  }, []);

  const sendMessage = useCallback(
    async (content: string, retryCount = 0) => {
      if (!state.sessionId || !content.trim()) return;

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        createdAt: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isStreaming: true,
        error: null,
      }));

      let assistantContent = '';
      const assistantId = `msg-${Date.now()}-assistant`;

      try {
        await chatApi.streamMessage(state.sessionId, content, (event: ChatStreamEvent) => {
          if (event.type === 'token') {
            assistantContent += event.delta;
            setState((prev) => {
              const lastMsg = prev.messages[prev.messages.length - 1];
              if (lastMsg?.id === assistantId) {
                return {
                  ...prev,
                  messages: prev.messages.map((msg) =>
                    msg.id === assistantId ? { ...msg, content: assistantContent } : msg,
                  ),
                };
              }
              return {
                ...prev,
                messages: [
                  ...prev.messages,
                  {
                    id: assistantId,
                    role: 'assistant',
                    content: assistantContent,
                    createdAt: new Date(),
                  },
                ],
              };
            });
          } else if (event.type === 'done') {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
            }));
          } else if (event.type === 'error') {
            setState((prev) => ({
              ...prev,
              error: event.message,
              isStreaming: false,
            }));
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        const isSessionError = message.includes('ChatSession') || message.includes('not found');

        // Auto-retry on session errors (up to 2 times)
        if (isSessionError && retryCount < 2) {
          console.warn(`Session error, retrying... (attempt ${retryCount + 1})`);
          // Clear invalid session
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
          // Retry after delay
          setTimeout(() => {
            sendMessage(content, retryCount + 1);
          }, 1000);
          return;
        }

        setState((prev) => ({
          ...prev,
          error: message,
          isStreaming: false,
        }));
      }
    },
    [state.sessionId],
  );

  return {
    ...state,
    sendMessage,
  };
}
