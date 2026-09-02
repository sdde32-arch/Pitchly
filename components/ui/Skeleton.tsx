import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`bg-surface-raised animate-pulse rounded-md ${className}`}
      {...props}
    />
  );
};

export const SpotlightCardSkeleton: React.FC = () => {
  return (
    <div className="w-[160px] shrink-0 rounded-2xl bg-surface-card border border-border-subtle overflow-hidden flex flex-col justify-between animate-pulse">
      <div className="w-full h-[96px] bg-surface-raised" />
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-3 w-8 rounded-md" />
        </div>
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </div>
  );
};

export const PitchCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-surface-card border border-border-subtle overflow-hidden flex flex-col justify-between animate-pulse p-3.5 space-y-3.5">
      {/* Image Banner */}
      <div className="w-full h-44 rounded-xl bg-surface-raised" />
      
      {/* Content Details */}
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-4 w-10 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border-subtle">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const BookingCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 space-y-4 animate-pulse">
      {/* Header row */}
      <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-40 rounded-md" />
        </div>
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>

      {/* Main pitch details */}
      <div className="flex gap-4 items-center">
        <div className="w-16 h-16 rounded-xl bg-surface-raised shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-44 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const OwnerSlotGridSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 space-y-6 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48 rounded-md" />
          <Skeleton className="h-3 w-64 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-surface-raised h-24 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md bg-border-subtle" />
              <Skeleton className="h-4 w-12 rounded-md bg-border-subtle" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-3 w-20 rounded-md bg-border-subtle" />
              <Skeleton className="h-6 w-16 rounded-lg bg-border-subtle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TurfDetailSkeleton: React.FC = () => {
  return (
    <div className="bg-app-base text-text-primary font-sans pb-32 min-h-screen animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="w-full h-[280px] sm:h-[360px] bg-surface-card relative border-b border-border-subtle">
        <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-surface-raised" />
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="w-10 h-10 rounded-xl bg-surface-raised" />
          <div className="w-10 h-10 rounded-xl bg-surface-raised" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 space-y-2 bg-gradient-to-t from-app-base to-transparent">
          <div className="h-4 w-28 rounded-md bg-surface-raised" />
          <div className="h-7 w-56 rounded-md bg-surface-raised" />
          <div className="h-4 w-36 rounded-md bg-surface-raised" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="px-4 mt-6 max-w-4xl mx-auto space-y-6">
        {/* Quick Info Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-col items-center justify-center space-y-2"
            >
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-14 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          ))}
        </div>

        {/* About Card Skeleton */}
        <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 space-y-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-4/5 rounded-md" />
          </div>
        </div>

        {/* Date Selector Skeleton */}
        <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <div className="flex gap-2.5 overflow-x-hidden pb-1">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div
                key={d}
                className="w-16 h-20 rounded-2xl bg-surface-raised shrink-0 flex flex-col items-center justify-center space-y-2"
              >
                <Skeleton className="h-3 w-6 rounded bg-border-subtle" />
                <Skeleton className="h-4 w-5 rounded bg-border-subtle" />
              </div>
            ))}
          </div>
        </div>

        {/* 3-Column Slots Grid Skeleton */}
        <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 space-y-3">
          <Skeleton className="h-4 w-40 rounded-md" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <Skeleton key={s} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar Skeleton */}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:w-[852px] sm:ml-6 p-4 bg-surface-card/95 backdrop-blur-md border border-border-subtle rounded-2xl z-40 max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>
    </div>
  );
};

export const CheckoutSkeleton: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto px-4 space-y-6 animate-pulse">
      {/* Selected Slot Card Skeleton */}
      <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 space-y-4">
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-xl bg-surface-raised shrink-0" />
          <div className="space-y-2 flex-1 justify-center flex flex-col">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle">
          <div className="p-3 rounded-xl bg-surface-raised space-y-1.5">
            <Skeleton className="h-3 w-14 rounded-md" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </div>
          <div className="p-3 rounded-xl bg-surface-raised space-y-1.5">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-3.5 w-20 rounded-md" />
          </div>
        </div>
      </div>

      {/* Order Summary Skeleton */}
      <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 space-y-3.5">
        <Skeleton className="h-3.5 w-32 rounded-md" />
        <div className="space-y-2.5">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-20 rounded-md" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-3.5 w-16 rounded-md" />
          </div>
          <div className="flex justify-between pt-2 border-t border-border-subtle">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
        </div>
      </div>

      {/* Bottom Button Skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
};
