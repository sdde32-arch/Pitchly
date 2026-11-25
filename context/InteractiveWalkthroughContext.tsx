import React, { createContext, useContext, useState, useCallback } from "react";

interface WalkthroughContextType {
  isOpen: boolean;
  openWalkthrough: (_ignored?: number | string) => void;
  startWalkthrough: (_ignored?: number | string) => void;
  closeWalkthrough: () => void;
  endWalkthrough: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export const InteractiveWalkthroughProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openWalkthrough = useCallback((_ignored?: number | string) => {
    setIsOpen(true);
  }, []);

  const closeWalkthrough = useCallback(() => {
    setIsOpen(false);
  }, []);

  const startWalkthrough = useCallback(
    (_ignored?: number | string) => {
      openWalkthrough();
    },
    [openWalkthrough]
  );

  const endWalkthrough = useCallback(() => {
    closeWalkthrough();
  }, [closeWalkthrough]);

  return (
    <WalkthroughContext.Provider
      value={{
        isOpen,
        openWalkthrough,
        startWalkthrough,
        closeWalkthrough,
        endWalkthrough,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
};

export const useInteractiveWalkthrough = () => {
  const ctx = useContext(WalkthroughContext);
  if (!ctx) {
    throw new Error(
      "useInteractiveWalkthrough must be used within an InteractiveWalkthroughProvider"
    );
  }
  return ctx;
};
