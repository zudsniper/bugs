import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface ThanksMessageProps {
  message?: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function ThanksMessage({ message, position }: ThanksMessageProps) {
  const positionStyles = {
    'bottom-right': { bottom: '24px', right: '24px' },
    'bottom-left': { bottom: '24px', left: '24px' },
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ duration: 0.3, type: "spring" }}
      className="br-thanks-popup"
      style={{
        position: 'fixed',
        zIndex: 10001,
        ...positionStyles[position]
      }}
    >
      <div className="br-thanks-icon">
        <CheckCircle size={24} />
      </div>
      
      <div>
        <p className="br-thanks-title">
          {message || "Thanks for your report!"}
        </p>
        <p className="br-thanks-subtitle">
          We'll look into it soon.
        </p>
      </div>
    </motion.div>
  );
}