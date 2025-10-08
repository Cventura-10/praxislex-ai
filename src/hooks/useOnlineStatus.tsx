import { useState, useEffect } from "react";

/**
 * Hook to detect online/offline status
 * Provides connection state and handles reconnection
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Track that we were offline to show reconnection message
      if (wasOffline) {
        setWasOffline(false);
        
        // Trigger background sync if supported
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((registration: any) => {
              if ('sync' in registration) {
                return registration.sync.register('sync-operations');
              }
            })
            .catch((error) => {
              console.error('Background sync registration failed:', error);
            });
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connection check (every 30 seconds)
    const checkInterval = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        setIsOnline(currentStatus);
        if (!currentStatus) {
          setWasOffline(true);
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, [isOnline, wasOffline]);

  return { isOnline, wasOffline };
}
