'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
}

export function ChatWidget({
  isOpen,
  onClose,
  messages,
  isStreaming,
  isLoading,
  error,
  onSendMessage,
}: ChatWidgetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-30"
          />

          {/* Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-h-96 rounded-lg shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center font-bold text-sm">
                  AR
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Alison Rafael</h3>
                  <p className="text-blue-100 text-xs">Full-stack Engineer</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-blue-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900 border-b border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Messages */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : (
              <ChatMessages messages={messages} />
            )}

            {/* Input */}
            <ChatInput onSend={onSendMessage} isStreaming={isStreaming} isLoading={isLoading} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
