'use client';

import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ChatIconProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatIcon({ isOpen, onToggle }: ChatIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 group">
      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="absolute bottom-full right-0 mb-3 bg-black text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap"
        >
          I'd like to chat, ask more details about me? Click here
          <div className="absolute top-full right-4 w-2 h-2 bg-black transform rotate-45" />
        </motion.div>
      )}

      {/* Icon Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
