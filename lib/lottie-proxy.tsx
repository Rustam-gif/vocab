import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function hasNativeLottie(): boolean {
  try {
    const cfg = (UIManager as any).getViewManagerConfig?.('LottieAnimationView');
    if (cfg) return true;
    return !!(UIManager as any)['LottieAnimationView'];
  } catch {
    return false;
  }
}

let Impl: any;
try {
  if (hasNativeLottie()) {
    Impl = require('lottie-react-native/lib/module').default;
    try { console.log('[lottie] native component available'); } catch {}
  } else {
    Impl = require('./lottie').default; // graceful no-op fallback
    try { console.log('[lottie] native component unavailable, using stub'); } catch {}
  }
} catch {
  Impl = require('./lottie').default;
}

// Global gate map. By default we keep a 1-hour throttling behavior,
// but allow certain keys (home/folder/IELTS icons) to be once-per-day.
type GateStore = {
  map: Map<string, number>;
  intervalMsDefault: number;
  session: Set<string>;
  dayKey?: string;
  dayPlayed: Set<string>;
  dayLoaded?: boolean;
};
const gate: GateStore = ((globalThis as any).__LOTTIE_GATE__ ||= {
  map: new Map<string, number>(),
  intervalMsDefault: 60 * 60 * 1000, // 1 hour
  session: new Set<string>(),
  dayKey: undefined,
  dayPlayed: new Set<string>(),
  dayLoaded: false,
});

const DAY_STORAGE_KEY = '@engniter.lottie.daily.v1';

function todayKey(): string {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return 'today';
  }
}

// Load persisted once-per-day state (fire-and-forget; we don’t block UI).
if (!gate.dayLoaded) {
  gate.dayLoaded = true;
  (async () => {
    try {
      const raw = await AsyncStorage.getItem(DAY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { day: string; keys: string[] };
        gate.dayKey = parsed.day;
        gate.dayPlayed = new Set(parsed.keys || []);
      }
    } catch {}
  })();
}

function ensureDayFresh() {
  const today = todayKey();
  if (gate.dayKey !== today) {
    gate.dayKey = today;
    gate.dayPlayed.clear();
  }
}

async function persistDayPlayed() {
  try {
    await AsyncStorage.setItem(
      DAY_STORAGE_KEY,
      JSON.stringify({ day: gate.dayKey || todayKey(), keys: Array.from(gate.dayPlayed) }),
    );
  } catch {}
}

// Stable keying for arbitrary `source` objects
const sourceKeys = new WeakMap<object, string>();
let sourceSeq = 0;
function keyForSource(src: any, stableKey?: string): string {
  if (stableKey) return String(stableKey);
  if (typeof src === 'number') return `asset#${src}`;
  if (src && typeof src === 'object') {
    const sKey = (src as any).__stableKey || (src as any).__vocadooStableKey;
    if (sKey) return String(sKey);
    const w = src as object;
    let k = sourceKeys.get(w);
    if (!k) {
      k = `obj#${++sourceSeq}`;
      sourceKeys.set(w, k);
    }
    return k;
  }
  return 'unknown';
}

type GateMode = 'hourly' | 'session' | 'daily' | 'none';

function modeForKey(key: string, props: any): GateMode {
  const forced: GateMode | undefined = (props as any).__gateMode || (props as any).gateMode;
  if (forced) return forced;
  if (typeof key === 'string' && (key.startsWith('home-icon:') || key.startsWith('folder-icon:') || key.startsWith('ielts-icon:'))) {
    // Icons should animate at most once per calendar day
    return 'daily';
  }
  return 'hourly';
}

function allowedToPlay(key: string, mode: GateMode): boolean {
  if (mode === 'none') return true;
  if (mode === 'daily') {
    ensureDayFresh();
    return !gate.dayPlayed.has(key);
  }
  if (mode === 'session') return !gate.session.has(key);
  const now = Date.now();
  const last = gate.map.get(key) || 0;
  return now - last >= gate.intervalMsDefault;
}
function markPlayed(key: string, mode: GateMode) {
  if (mode === 'daily') {
    ensureDayFresh();
    gate.dayPlayed.add(key);
    persistDayPlayed();
  } else if (mode === 'session') {
    gate.session.add(key);
  } else if (mode === 'hourly') {
    gate.map.set(key, Date.now());
  }
}

// Thin wrapper that throttles autoPlay/imperative play()
const LottieThrottled = forwardRef<any, any>(function LottieThrottled(props, ref) {
  const { source, autoPlay, loop } = props || {};
  const bypass = !!(props && (props.__bypassGate || (props as any).bypassGate));
  const key = useMemo(() => keyForSource(source, (props as any).__stableKey || (props as any).stableKey), [source, (props as any).__stableKey, (props as any).stableKey]);
  const mode: GateMode = useMemo(() => modeForKey(key, props), [key, props]);
  const canAuto = !!autoPlay && (bypass || allowedToPlay(key, mode));
  const innerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    play: (...args: any[]) => {
      if (bypass || allowedToPlay(key, mode)) {
        try {
          if (!bypass) markPlayed(key, mode);
          innerRef.current?.play?.(...args);
        } catch {}
      }
    },
    reset: (...args: any[]) => innerRef.current?.reset?.(...args),
    pause: (...args: any[]) => innerRef.current?.pause?.(...args),
  }), [key, mode, bypass]);

  useEffect(() => {
    if (canAuto && !bypass) markPlayed(key, mode);
  }, [canAuto, key, bypass, mode]);

  const passed = {
    ...props,
    autoPlay: canAuto,
    loop: canAuto ? loop : false,
    progress: props?.progress !== undefined ? props.progress : (canAuto ? undefined : 1),
  };

  return <Impl ref={innerRef} {...passed} />;
});

export default LottieThrottled;
