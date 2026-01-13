/**
 * SafeTextInput - A TextInput wrapper that prevents iOS keyboard session corruption
 *
 * CRITICAL: Never auto-focus. User must tap to focus.
 * This prevents iOS RTIInputSystemClient deadlock from keyboard session corruption.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Platform, TextInput, TextInputProps } from 'react-native';

export interface SafeTextInputRef {
  /** Focus the input - only call on user tap */
  focus: () => void;
  /** Blur the input */
  blur: () => void;
  /** Check if focused */
  isFocused: () => boolean;
  /** Clear the input */
  clear: () => void;
  /** Set native props */
  setNativeProps: (props: object) => void;
}

interface SafeTextInputProps extends TextInputProps {
  // autoFocus is intentionally ignored - never auto-focus
}

const SafeTextInput = forwardRef<SafeTextInputRef, SafeTextInputProps>(
  ({ autoFocus: _ignored, ...props }, ref) => {
    const inputRef = useRef<TextInput>(null);

    // Log mounts to catch any unexpected early renders that could corrupt iOS keyboard sessions
    useEffect(() => {
      if (Platform.OS === 'ios') {
        const label = props.placeholder || props.testID || props.accessibilityLabel || 'unknown';
        try { console.log('[SafeTextInput] mounted:', label); } catch {}
        return () => { try { console.log('[SafeTextInput] unmounted:', label); } catch {} };
      }
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      isFocused: () => inputRef.current?.isFocused() ?? false,
      clear: () => inputRef.current?.clear(),
      setNativeProps: (nativeProps) => inputRef.current?.setNativeProps(nativeProps),
    }));

    // NO automatic focus - user must tap to focus
    // This is the only safe pattern for iOS keyboard sessions

    return (
      <TextInput
        ref={inputRef}
        {...props}
        // Never pass autoFocus to native
        autoFocus={false}
      />
    );
  }
);

SafeTextInput.displayName = 'SafeTextInput';

export default SafeTextInput;
