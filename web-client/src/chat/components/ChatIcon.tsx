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
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Tooltip - Left side with arrow pointing right */}
      {showTooltip && !isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          className="relative bg-black text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap"
        >
          I'd like to chat, ask more details about me? Click here
          {/* Arrow pointing right */}
          <div className="absolute right-[-6px] top-1/2 transform -translate-y-1/2 w-3 h-3 bg-black" style={{clipPath: 'polygon(0 0, 100% 50%, 0 100%)'}} />
        </motion.div>
      )}

      {/* Icon Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 shrink-0"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
