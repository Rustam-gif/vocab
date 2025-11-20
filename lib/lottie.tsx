import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';

export type LottieViewHandle = {
  play?: () => void;
  reset?: () => void;
  pause?: () => void;
};

type Props = {
  style?: any;
  source?: any;
  autoPlay?: boolean;
  loop?: boolean;
};

const LottieView = forwardRef<LottieViewHandle, Props>(function LottieShim(
  { style }: Props,
  ref
) {
  useImperativeHandle(ref, () => ({
    play: () => {},
    reset: () => {},
    pause: () => {},
  }), []);
  try { console.log('[lottie] using stub component'); } catch {}
  return <View style={style} />;
});

export default LottieView;
