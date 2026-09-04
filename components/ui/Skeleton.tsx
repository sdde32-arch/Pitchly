import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  shimmer?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  shimmer = true,
  ...props
}) => {
  return (
    <div
      className={`bg-surface-raised/80 rounded-md relative overflow-hidden ${
        shimmer ? "shimmer-effect" : "animate-pulse"
      } ${className}`}
      {...props}
    />
  );
};

export const SpotlightCardSkeleton: React.FC = () => {
  return (
    <div className="relative min-w-[280px] sm:min-w-[340px] max-w-[360px] h-[220px] sm:h-[240px] rounded-3xl overflow-hidden border border-border-subtle bg-surface-card snap-start shrink-0 flex flex-col justify-between p-3.5 select-none shadow-md">
      {/* Background with shimmer */}
      <div className="absolute inset-0 bg-surface-raised shimmer-effect" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 pointer-events-none" />

      {/* Top Badges */}
      <div className="relative z-10 flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full bg-surface-card/70" />
        <Skeleton className="h-6 w-12 rounded-full bg-surface-card/70" />
      </div>

      {/* Bottom Content */}
      <div className="relative z-10 space-y-2">
        <div className="space-y-1">
          <Skeleton className="h-3 w-24 rounded bg-surface-card/60" />
          <Skeleton className="h-5 w-3/4 rounded-lg bg-surface-card/80" />
          <Skeleton className="h-3.5 w-32 rounded bg-surface-card/60" />
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded-md bg-surface-card/70" />
          <Skeleton className="h-8 w-24 rounded-full bg-surface-card/80" />
        </div>
      </div>
    </div>
  );
};

export const SpotlightCarouselSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-3 w-64 rounded-md" />
        </div>
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>

      <div className="flex gap-4 overflow-x-hidden pb-2 pt-1">
        <SpotlightCardSkeleton />
        <SpotlightCardSkeleton />
        <SpotlightCardSkeleton />
      </div>
    </div>
  );
};

export const PitchCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface-card rounded-3xl border border-border-subtle overflow-hidden flex flex-col justify-between shadow-xs select-none">
      <div>
        {/* Pitch Stadium Image Frame with aspect-[16/10] */}
        <div className="relative w-full aspect-[16/10] bg-surface-raised shimmer-effect overflow-hidden">
          {/* Top Row Badges */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-6 w-20 rounded-xl bg-surface-card/70" />
              <Skeleton className="hidden sm:block h-6 w-24 rounded-xl bg-surface-card/60" />
            </div>
            <Skeleton className="w-8 h-8 rounded-full bg-surface-card/70" />
          </div>

          {/* Bottom Badges inside Image */}
          <div className="absolute bottom-3 inset-x-3 flex items-end justify-between pointer-events-none">
            <Skeleton className="h-5 w-24 rounded-lg bg-surface-card/70" />
            <Skeleton className="h-6 w-14 rounded-xl bg-surface-card/70" />
          </div>
        </div>

        {/* Card Body Details */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Title & Distance */}
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-36 rounded-md" />
              <Skeleton className="h-3.5 w-12 rounded-md" />
            </div>
          </div>

          {/* Amenity Badges */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-lg" />
          </div>

          {/* 1-Tap Slot Selection */}
          <div className="pt-2 border-t border-border-subtle space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <Skeleton className="h-8 rounded-xl" />
              <Skeleton className="h-8 rounded-xl" />
              <Skeleton className="h-8 rounded-xl" />
              <Skeleton className="h-8 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Price & Action */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-border-subtle flex items-center justify-between gap-3 bg-surface-card/40">
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-14 rounded" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
};

export const SmartDashboardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface-card rounded-2xl border border-border-subtle p-4.5 sm:p-6 shadow-xs space-y-5 select-none">
      {/* Header Segmented Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
        <div className="inline-flex p-1 rounded-xl bg-surface-raised border border-border-subtle gap-1">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
        <Skeleton className="hidden sm:block h-4 w-24 rounded-md" />
      </div>

      {/* Main Ticket Area */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-6 w-56 rounded-lg" />
            <Skeleton className="h-4 w-44 rounded-md" />
          </div>

          {/* Countdown Clock Box */}
          <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle px-3.5 py-2.5 rounded-xl shrink-0">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border-subtle">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>

        {/* Weather Mini Bar */}
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  );
};

export const HomeCommunityPickupsSkeleton: React.FC = () => {
  return (
    <div className="space-y-3.5 select-none">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-5 w-44 rounded-md" />
          </div>
          <Skeleton className="h-3 w-56 rounded-md" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-surface-card border border-border-subtle space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MatchdayDateStripSkeleton: React.FC = () => {
  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-28 rounded-md" />
        </div>
        <Skeleton className="h-3 w-32 rounded-md" />
      </div>
      <div className="flex items-center gap-2 overflow-x-hidden pb-1 pt-0.5">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] h-[66px] rounded-2xl p-2 bg-surface-card border border-border-subtle space-y-1.5 shrink-0"
          >
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-4 w-6 rounded-md" />
            <Skeleton className="h-2.5 w-8 rounded" />
          </div>
        ))}
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
