import React from 'react';
import { ImageOff } from 'lucide-react';

interface PhotoPlaceholderProps {
  className?: string;
  iconSize?: number;
  label?: string;
}

export const PhotoPlaceholder: React.FC<PhotoPlaceholderProps> = ({
  className = 'w-full h-full min-h-[120px]',
  iconSize = 22,
  label = 'No photo yet',
}) => {
  return (
    <div
      className={`bg-surface-raised border border-border-subtle flex flex-col items-center justify-center text-text-muted gap-1.5 p-3 text-center select-none ${className}`}
    >
      <ImageOff size={iconSize} className="text-text-muted shrink-0" />
      {label ? <span className="text-[11px] font-bold text-text-secondary">{label}</span> : null}
    </div>
  );
};
