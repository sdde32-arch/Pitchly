export const FEATURES = {
  squads: false,
  tournaments: false,
  matchInvites: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const isFeatureEnabled = (f: FeatureFlag): boolean => FEATURES[f];
