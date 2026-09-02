
import React, { createContext, useContext, useEffect, useState } from 'react'; interface PWAContextType { installPrompt: any; isInstallable: boolean; installApp: () => void;
}
const PWAContext = createContext<PWAContextType | undefined>(undefined);
export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { 
  const [installPrompt, setInstallPrompt] = useState<any>(null); 
  useEffect(() => { 
    const handler = (e: any) => { 
      // Prevent the mini-infobar from appearing on mobile 
      e.preventDefault(); 
      // Stash the event so it can be triggered later. 
      setInstallPrompt(e); 
    }; 
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler); 
  }, []);
  const installApp = () => { 
    if (!installPrompt) return; 
    // Show the install prompt 
    installPrompt.prompt(); 
    // Wait for the user to respond to the prompt 
    installPrompt.userChoice.then((choiceResult: any) => { 
      if (choiceResult.outcome === 'accepted') { 
        console.log('User accepted the install prompt');
      } else { 
        console.log('User dismissed the install prompt');
      } 
      setInstallPrompt(null); 
    }); 
  };
  return ( <PWAContext.Provider value={{ installPrompt, isInstallable: !!installPrompt, installApp }}> {children} </PWAContext.Provider> );
};
export const usePWA = () => { const context = useContext(PWAContext);
if (context === undefined) { throw new Error('usePWA must be used within a PWAProvider');
} return context;
};
