import React from "react";
import { HowItWorksSheet } from "./HowItWorksSheet";

/**
 * InteractiveWalkthroughOverlay renders the role-aware HowItWorksSheet
 * when opened explicitly by a Help / How it works button.
 */
export const InteractiveWalkthroughOverlay: React.FC = () => {
  return <HowItWorksSheet />;
};

export default InteractiveWalkthroughOverlay;
