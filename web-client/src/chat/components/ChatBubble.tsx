'use client';

import { motion } from 'framer-motion';
import { easeOut } from '../../lib/motion';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  index?: number;
}

export function ChatBubble({ role, content, index = 0 }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: easeOut }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
      </div>
    </motion.div>
  );
}
