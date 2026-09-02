import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'text';
  accentColor?: 'lime' | 'sky' | 'violet' | 'amber';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionVariant = 'primary',
  accentColor = 'lime',
  className = ''
}) => {
  const accentStyles = {
    lime: 'bg-primary-lime/10 text-primary-lime border-primary-lime/30',
    sky: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30',
    violet: 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30',
    amber: 'bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30',
  }[accentColor];

  return (
    <motion.div
      id="empty-state-container"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-surface-card border border-border-subtle max-w-md mx-auto shadow-sm ${className}`}
    >
      <div 
        id="empty-state-icon-container"
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${accentStyles}`}
      >
        <Icon 
          id="empty-state-icon"
          size={24} 
          strokeWidth={2}
        />
      </div>

      <h3 
        id="empty-state-title"
        className="text-base font-bold text-text-primary mb-1.5 font-sans"
      >
        {title}
      </h3>

      <p 
        id="empty-state-description"
        className="text-xs sm:text-sm font-medium text-text-secondary leading-relaxed max-w-xs mb-6 font-sans"
      >
        {description}
      </p>

      {actionText && onAction && (
        <Button
          id="empty-state-action-btn"
          variant={actionVariant}
          onClick={onAction}
          className="w-full sm:w-auto"
        >
          {actionText}
        </Button>
      )}
    </motion.div>
  );
};
