import React from 'react';
import { Check } from 'lucide-react';
import { AppTheme } from '../../tokens';

export interface StepItem {
  number: number;
  label: string;
  sublabel?: string;
}

export interface StepTrackerProps {
  theme?: AppTheme;
  currentStep: number; // 1, 2, 3, or 4
  onStepClick?: (stepNumber: number) => void;
  steps?: StepItem[];
}

const DEFAULT_STEPS: StepItem[] = [
  { number: 1, label: 'Slot', sublabel: 'Select Time' },
  { number: 2, label: 'Details', sublabel: 'Player Info' },
  { number: 3, label: 'Payment', sublabel: 'Mobile Money' },
  { number: 4, label: 'Done', sublabel: 'Pass Issued' },
];

export const StepTracker: React.FC<StepTrackerProps> = ({
  theme = 'dark',
  currentStep = 1,
  onStepClick,
  steps = DEFAULT_STEPS,
}) => {
  const containerBg = 'bg-surface-card border-border-subtle shadow-xl';
  const lineBg = 'bg-border-subtle';
  const circleUpcomingBg = 'bg-surface-raised border-[#383838] text-text-secondary group-hover:border-zinc-500';

  return (
    <div className={`w-full border rounded-[16px] p-4  transition-colors ${containerBg}`}>
      <div className="relative flex items-center justify-between max-w-2xl mx-auto">
        
        {/* Progress bar background line */}
        <div className={`absolute top-4 left-8 right-8 h-[2px] ${lineBg} -z-0`} />

        {/* Progress bar active line */}
        <div
          className="absolute top-4 left-8 h-[2px] bg-primary-lime transition-all duration-300 -z-0"
          style={{
            width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (steps.length - 1)) * 100))}%`,
          }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div
              key={step.number}
              onClick={() => onStepClick?.(step.number)}
              className="relative z-10 flex flex-col items-center cursor-pointer group"
            >
              {/* Step Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-black text-xs transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-lime text-accent-text ring-4 ring-primary-lime/25 shadow-lg shadow-primary-lime/20 scale-110'
                    : isCompleted
                    ? 'bg-primary-lime text-accent-text'
                    : circleUpcomingBg
                }`}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              {/* Step Title Label */}
              <span
                className={`mt-2.5 text-xs font-display font-bold tracking-wider transition-colors ${
                  isActive
                    ? 'text-primary-lime font-extrabold'
                    : isCompleted
                    ? 'text-text-primary'
                    : 'text-text-secondary group-hover:text-zinc-300'
                }`}
              >
                {step.label}
              </span>

              {/* Optional Sublabel */}
              {step.sublabel && (
                <span className="hidden sm:block text-[10px] font-medium tracking-tight text-text-secondary">
                  {step.sublabel}
                </span>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
};
