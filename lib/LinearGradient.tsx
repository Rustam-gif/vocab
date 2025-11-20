import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

type Props = {
  colors?: string[]; // e.g., ['#FEB9A3', '#F6F0C4']
  start?: { x: number; y: number }; // 0..1
  end?: { x: number; y: number }; // 0..1
  style?: any;
  children?: React.ReactNode;
};

export function LinearGradient({
  colors = ['#187486', '#187486'],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  children,
}: Props) {
  const stops = useMemo(() => {
    const arr = Array.isArray(colors) && colors.length > 0 ? colors : ['#187486'];
    const count = arr.length;
    if (count === 1) {
      return [<Stop key={0} offset="0%" stopColor={arr[0]} stopOpacity={1} />];
    }
    return arr.map((c, i) => (
      <Stop key={i} offset={`${(i / (count - 1)) * 100}%`} stopColor={c} stopOpacity={1} />
    ));
  }, [colors]);

  const x1 = `${Math.max(0, Math.min(1, start.x)) * 100}%`;
  const y1 = `${Math.max(0, Math.min(1, start.y)) * 100}%`;
  const x2 = `${Math.max(0, Math.min(1, end.x)) * 100}%`;
  const y2 = `${Math.max(0, Math.min(1, end.y)) * 100}%`;

  return (
    // Make sure the wrapper is a proper layout parent and clips the SVG to rounded corners
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {/* Use absolute fill only; avoid width/height percentages that can desync with layout */}
      <Svg style={[StyleSheet.absoluteFill as any, { position: 'absolute' }]} pointerEvents="none">
        <Defs>
          <SvgLinearGradient id="__grad" x1={x1} y1={y1} x2={x2} y2={y2}>
            {stops}
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#__grad)" />
      </Svg>
      {children}
    </View>
  );
}

export default LinearGradient;
