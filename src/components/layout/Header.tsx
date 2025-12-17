import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  children?: React.ReactNode;
}

export function Header({ title, showLogo = true, children }: HeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between px-8 py-6">
      <div className="flex items-center gap-4">
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-neon-cyan/30 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-br from-neon-cyan to-neon-purple p-2.5 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold gradient-neon-text">
              Debate Simulator
            </span>
          </motion.div>
        )}
        {title && (
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white ml-4 pl-4 border-l border-white/20"
          >
            {title}
          </motion.h1>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-4">
          {children}
        </div>
      )}
    </header>
  );
}
