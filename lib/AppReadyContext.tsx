/**
 * AppReadyContext - Guards TextInput focus until the app is fully ready
 *
 * This prevents keyboard freezing on cold start by ensuring:
 * 1. All pending interactions complete (InteractionManager)
 * 2. Main thread is idle
 * 3. Responder chain is fully established
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';

interface AppReadyContextValue {
  isAppReady: boolean;
  /** Call this to execute a callback only when app is ready */
  whenReady: (callback: () => void) => void;
  /** Manual override to mark app as ready (use sparingly) */
  markReady: () => void;
}

const AppReadyContext = createContext<AppReadyContextValue>({
  isAppReady: false,
  whenReady: () => {},
  markReady: () => {},
});

export function AppReadyProvider({ children }: { children: React.ReactNode }) {
  const [isAppReady, setIsAppReady] = useState(false);
  const pendingCallbacks = useRef<Array<() => void>>([]);
  const readyRef = useRef(false);

  useEffect(() => {
    // Use InteractionManager to wait for all animations and interactions to complete
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      // Additional delay to ensure iOS responder chain is fully established
      // This is critical for cold start keyboard issues
      const timer = setTimeout(() => {
        readyRef.current = true;
        setIsAppReady(true);

        // Execute any pending callbacks
        pendingCallbacks.current.forEach(cb => {
          try { cb(); } catch {}
        });
        pendingCallbacks.current = [];
      }, Platform.OS === 'ios' ? 300 : 100);

      return () => clearTimeout(timer);
    });

    return () => interactionHandle.cancel();
  }, []);

  const whenReady = useCallback((callback: () => void) => {
    if (readyRef.current) {
      // App is ready, execute immediately but on next tick
      // to avoid synchronous focus during render
      setTimeout(callback, 0);
    } else {
      // Queue for later execution
      pendingCallbacks.current.push(callback);
    }
  }, []);

  const markReady = useCallback(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      setIsAppReady(true);
      pendingCallbacks.current.forEach(cb => {
        try { cb(); } catch {}
      });
      pendingCallbacks.current = [];
    }
  }, []);

  return (
    <AppReadyContext.Provider value={{ isAppReady, whenReady, markReady }}>
      {children}
    </AppReadyContext.Provider>
  );
}

export function useAppReady() {
  return useContext(AppReadyContext);
}

export default AppReadyContext;
