/**
 * TextInputGate - Global gate to prevent TextInput mounting until user interaction
 *
 * CRITICAL: iOS creates a keyboard session when ANY TextInput mounts.
 * This can corrupt RTIInputSystemClient and deadlock the UI thread.
 *
 * This gate ensures NO TextInput is ever mounted until:
 * 1. User has explicitly tapped somewhere (proving they're interacting)
 * 2. App has been running for at least 2 seconds (ensuring stability)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';

type TextInputGateContextType = {
  isTextInputAllowed: boolean;
  allowTextInput: () => void;
};

const TextInputGateContext = createContext<TextInputGateContextType>({
  isTextInputAllowed: false,
  allowTextInput: () => {},
});

export function useTextInputGate() {
  return useContext(TextInputGateContext);
}

/**
 * Hook to check if TextInput can be mounted
 */
export function useCanMountTextInput(): boolean {
  const { isTextInputAllowed } = useTextInputGate();
  return isTextInputAllowed;
}

/**
 * Provider that blocks all TextInput until user interaction
 */
export function TextInputGateProvider({ children }: { children: React.ReactNode }) {
  const [isTextInputAllowed, setIsTextInputAllowed] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [hasTimePassed, setHasTimePassed] = useState(false);

  // Require both user interaction AND minimum time
  useEffect(() => {
    if (hasUserInteracted && hasTimePassed) {
      setIsTextInputAllowed(true);
    }
  }, [hasUserInteracted, hasTimePassed]);

  // Minimum time gate (2 seconds after mount)
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTimePassed(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const allowTextInput = useCallback(() => {
    setHasUserInteracted(true);
  }, []);

  // Wrap children in a touch detector to capture first interaction
  return (
    <TextInputGateContext.Provider value={{ isTextInputAllowed, allowTextInput }}>
      <View
        style={{ flex: 1 }}
        // Capture touches without blocking child responders/scroll views
        onStartShouldSetResponderCapture={() => { allowTextInput(); return false; }}
        onTouchStart={allowTextInput}
      >
        {children}
      </View>
    </TextInputGateContext.Provider>
  );
}

/**
 * HOC to conditionally render TextInput only when allowed
 * Use this to wrap any TextInput that might mount early
 */
export function withTextInputGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
): React.FC<P> {
  return function GatedTextInput(props: P) {
    const { isTextInputAllowed } = useTextInputGate();

    if (!isTextInputAllowed) {
      if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
