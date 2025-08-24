import React from 'react';
import { motion } from 'framer-motion';
import { Bug } from 'lucide-react';

interface FloatingTriggerProps {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onClick: () => void;
  primaryColor?: string;
  icon?: React.ReactNode;
}

export function FloatingTrigger({ position, onClick, primaryColor, icon }: FloatingTriggerProps) {
  const positionClasses = {
    'bottom-right': 'br-position-bottom-right',
    'bottom-left': 'br-position-bottom-left',
    'top-right': 'br-position-top-right',
    'top-left': 'br-position-top-left'
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`br-floating-button ${positionClasses[position]}`}
      style={{
        backgroundColor: primaryColor || 'var(--br-color-primary)',
      }}
      aria-label="Report a bug"
      data-bug-reporter-widget
    >
      {icon || <Bug size={20} />}
    </motion.button>
  );
}