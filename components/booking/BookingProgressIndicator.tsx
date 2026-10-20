import React from "react";
import { Check, Clock, CheckSquare, CreditCard, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export type BookingStep = 1 | 2 | 3;

export interface StepConfig {
  number: BookingStep;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const BOOKING_STEPS: StepConfig[] = [
  {
    number: 1,
    label: "Select Time",
    shortLabel: "Time",
    description: "Date & Slots",
    icon: Clock,
  },
  {
    number: 2,
    label: "Confirm",
    shortLabel: "Confirm",
    description: "Review & Fee",
    icon: CheckSquare,
  },
  {
    number: 3,
    label: "Payment",
    shortLabel: "Payment",
    description: "Method & Proof",
    icon: CreditCard,
  },
];

interface BookingProgressIndicatorProps {
  currentStep: BookingStep;
  onStepClick?: (step: BookingStep) => void;
  className?: string;
}

export const BookingProgressIndicator: React.FC<BookingProgressIndicatorProps> = ({
  currentStep,
  onStepClick,
  className = "",
}) => {
  const currentStepData = BOOKING_STEPS.find((s) => s.number === currentStep) || BOOKING_STEPS[0];
  const progressPercent = ((currentStep - 1) / (BOOKING_STEPS.length - 1)) * 100;

  return (
    <div
      role="region"
      aria-label="Booking flow progress"
      className={`w-full max-w-lg mx-auto mb-6 px-2 ${className}`}
    >
      {/* Visual Step Bar */}
      <div className="relative flex items-start justify-between">
        {/* Background track line behind step circles */}
        <div 
          aria-hidden="true" 
          className="absolute top-5 left-7 right-7 h-1 bg-border-subtle rounded-full -z-0"
        >
          <motion.div
            className="h-full bg-primary-lime rounded-full"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Steps */}
        {BOOKING_STEPS.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isClickable = isCompleted && Boolean(onStepClick);

          return (
            <div
              key={step.number}
              className="flex flex-col items-center relative z-10 w-24 sm:w-28 text-center select-none"
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (isClickable && onStepClick) {
                    onStepClick(step.number);
                  }
                }}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Stage ${step.number}: ${step.label} (${
                  isCompleted ? "Completed, click to return" : isCurrent ? "Active stage" : "Upcoming stage"
                })`}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-transform duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-lime ${
                  isClickable
                    ? "cursor-pointer hover:scale-105"
                    : isCurrent
                    ? "cursor-default"
                    : "cursor-not-allowed opacity-90"
                }`}
              >
                {/* Active Outer Glow */}
                {isCurrent && (
                  <motion.span
                    layoutId="active-step-glow"
                    className="absolute -inset-1 rounded-full bg-primary-lime/25 blur-xs pointer-events-none"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-sm ${
                    isCompleted
                      ? "bg-primary-lime text-accent-text hover:brightness-105"
                      : isCurrent
                      ? "bg-primary-lime text-accent-text ring-4 ring-primary-lime/25 ring-offset-2 ring-offset-app-base"
                      : "bg-surface-card border-2 border-border-subtle text-text-secondary"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} className="stroke-[3]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
              </button>

              {/* Step Labels */}
              <div className="mt-2 flex flex-col items-center pointer-events-none">
                <span
                  className={`text-[12px] font-bold tracking-tight transition-colors whitespace-nowrap ${
                    isCurrent
                      ? "text-primary-lime"
                      : isCompleted
                      ? "text-text-primary"
                      : "text-text-secondary"
                  }`}
                >
                  <span className="hidden xs:inline">{step.label}</span>
                  <span className="inline xs:hidden">{step.shortLabel}</span>
                </span>
                <span
                  className={`text-[10px] hidden sm:block tracking-normal ${
                    isCurrent
                      ? "text-text-secondary font-medium"
                      : isCompleted
                      ? "text-text-secondary/70"
                      : "text-text-secondary/50"
                  }`}
                >
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Badge indicator */}
      <div className="mt-3.5 flex items-center justify-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-[11px] font-medium text-text-secondary shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-lime animate-pulse shrink-0" />
          <span className="text-text-secondary">Stage {currentStep} of {BOOKING_STEPS.length}:</span>
          <span className="text-text-primary font-bold">{currentStepData.label}</span>
          {currentStep > 1 && (
            <span className="text-[10px] text-text-secondary/70 ml-1 hidden sm:inline">
              (Click completed steps to review)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
