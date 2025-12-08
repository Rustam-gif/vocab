import React, { useEffect } from 'react';
import { useAppStore } from './store';
import { getTheme } from './theme';
import PreloadService from '../services/PreloadService';
import { DeviceEventEmitter } from 'react-native';

type Route = { pathname: string; params?: Record<string, any> };

type Router = {
  push: (path: string | Route) => void;
  replace: (path: string | Route) => void;
  back: () => void;
};

const RouterCtx = React.createContext<{
  stack: Route[];
  setStack: React.Dispatch<React.SetStateAction<Route[]>>;
} | null>(null);

function normalize(input: string | Route): Route {
  if (typeof input !== 'string') return input;
  const [pathname, query] = input.split('?');
  const params: Record<string, string> = {};
  if (query) {
    for (const kv of query.split('&')) {
      const [k, v] = kv.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    }
  }
  return { pathname, params };
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = React.useState<Route[]>([{ pathname: '/' }]);
  // Expose current params to hooks used inside screens
  const top = stack[stack.length - 1];
  (globalThis as any).__ROUTE_PARAMS = top?.params || {};
  // Initialize app services (vault, analytics, progress, preferences) on first mount
  const initializeApp = useAppStore(s => s.initialize);
  useEffect(() => {
    initializeApp().catch(() => {});
  }, [initializeApp]);
  return <RouterCtx.Provider value={{ stack, setStack }}>{children}</RouterCtx.Provider>;
}

export function useRouter(): Router {
  const ctx = React.useContext(RouterCtx);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  const { stack, setStack } = ctx;
  return React.useMemo(
    () => ({
      push: (p: string | Route) => setStack(s => [...s, normalize(p)]),
      replace: (p: string | Route) => setStack(s => [...s.slice(0, -1), normalize(p)]),
      back: () =>
        setStack(s => {
          if (s.length <= 1) return s;
          const prev = s[s.length - 2];
          // If the previous route is an overlay route, skip it
          if (prev?.pathname === '/translate' || prev?.pathname === '/story/StoryExercise') {
            if (s.length > 2) return s.slice(0, -2);
            // If translate was the only previous page, go to home
            return [{ pathname: '/' }];
          }
          // Normal back: pop one route
          return s.slice(0, -1);
        }),
    }),
    [setStack]
  );
}

export function useLocalSearchParams<T extends Record<string, any> = Record<string, any>>() {
  const ctx = React.useContext(RouterCtx);
  const top = ctx?.stack[ctx.stack.length - 1];
  const base = (top?.params || {}) as Record<string, any>;
  // Derive params from known dynamic segments if not provided via query
  const pathname = top?.pathname || '';
  const derived: Record<string, any> = { ...base };
  if (derived.id == null) {
    const j = pathname.match(/^\/journal\/(.+)$/);
    if (j) derived.id = decodeURIComponent(j[1]);
  }
  if (derived.id == null) {
    const v = pathname.match(/^\/vault\/word\/(.+)$/);
    if (v) derived.id = decodeURIComponent(v[1]);
  }
  return derived as T;
}

export function useRouteKey(): string {
  const ctx = React.useContext(RouterCtx);
  const top = ctx?.stack[ctx.stack.length - 1];
  const key = top ? top.pathname + '::' + JSON.stringify(top.params || {}) : '::';
  return key;
}

export function usePathname(): string {
  const ctx = React.useContext(RouterCtx);
  const top = ctx?.stack[ctx.stack.length - 1];
  return top?.pathname || '/';
}

export function Stack({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
Stack.Screen = (_props: any) => null;

// Minimal route renderer mapping paths to screens
function ScreenFor(pathname: string): React.ComponentType<any> {
  switch (pathname) {
    case '/':
      return require('../app/index').default;
    case '/vault':
      return require('../app/vault').default;
    case '/vault-folder':
      return require('../app/vault-folder').default;
    case '/vault-word':
      return require('../app/vault-word').default;
    case '/flashcards':
      return require('../app/flashcards').default;
    case '/translate':
      return require('../app/translate').default;
    case '/scan-words':
      return require('../app/scan-words').default;
    case '/word-sprint':
      return require('../app/word-sprint').default;
    case '/journal':
      return require('../app/journal').default;
    case '/profile':
      return require('../app/profile').default;
    case '/stats':
      return require('../app/stats').default;
    case '/report':
      return require('../app/report').default;
    case '/ielts':
      return require('../app/ielts/index').default;
    case '/ielts/writing':
      return require('../app/ielts/writing').default;
    case '/ielts/reading':
      return require('../app/ielts/reading').default;
    case '/ielts/vocabulary':
      return require('../app/ielts/vocabulary').default;
    case '/mission':
      return require('../app/mission').default;
    case '/settings':
      try { return require('../app/settings/index').default; } catch {}
      try { return require('../app/settings').default; } catch {}
      return require('../app/index').default;
    case '/placement':
      return require('../app/placement/index').default;
    case '/placement/test':
      return require('../app/placement/test').default;
    case '/placement/result':
      return require('../app/placement/result').default;
    case '/story/StoryExercise':
      return require('../app/story/StoryExercise').default;
    case '/quiz/level-select':
      return require('../app/quiz/level-select').default;
    case '/quiz/learn':
      return require('../app/quiz/learn').default;
    case '/quiz/atlas-results':
      return require('../app/quiz/atlas-results').default;
    case '/quiz/word-intro':
      return require('../app/quiz/word-intro').default;
    case '/quiz/quiz-screen':
      return require('../app/quiz/quiz-screen').default;
    case '/quiz/atlas-practice-integrated':
      return require('../app/quiz/atlas-practice-integrated').default;
    default:
      if (pathname.startsWith('/journal/')) {
        return require('../app/journal/[id]').default;
      }
      if (pathname.startsWith('/vault/word/')) {
        return require('../app/vault-word').default;
      }
      if (pathname === '/story-exercise') {
        return require('../app/story-exercise').default;
      }
      // Fallback to home
      return require('../app/index').default;
  }
}

export function RouteRenderer() {
  const ctx = React.useContext(RouterCtx);
  if (!ctx) return null;
  const top = ctx.stack[ctx.stack.length - 1];
  const key = top.pathname + JSON.stringify(top.params || {});
  const prevRoute = ctx.stack.length > 1 ? ctx.stack[ctx.stack.length - 2] : null;
  const prevKey = prevRoute ? prevRoute.pathname + JSON.stringify(prevRoute.params || {}) : null;
  // Theme for flip backdrop
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  // Access react-native primitives before using in hooks
  const { View, Animated, Easing, Dimensions, PanResponder, TouchableOpacity, Text, Image } = require('react-native');
  const [navHidden, setNavHidden] = React.useState(false);
  const navAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener('NAV_VISIBILITY', (payload: any) => {
      if (payload === 'hide' || payload === true) setNavHidden(true);
      else setNavHidden(false);
    });
    return () => sub.remove();
  }, []);
  React.useEffect(() => {
    try {
      Animated.timing(navAnim, {
        toValue: navHidden ? 1 : 0,
        duration: 380,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }).start();
    } catch {
      navAnim.setValue(navHidden ? 1 : 0);
    }
  }, [navHidden, navAnim]);

  React.useEffect(() => {
    return undefined;
  }, [navHidden, top.pathname]);


  // Cache screen elements to avoid remounting (prevents image/icon reloads)
  const screenCacheRef = React.useRef(new Map<string, React.ReactElement>());
  function routeKeyFor(r: Route): string {
    return r.pathname + '::' + JSON.stringify(r.params || {});
  }
  function getScreenEl(r: Route): React.ReactElement {
    const k = routeKeyFor(r);
    const cached = screenCacheRef.current.get(k);
    if (cached) return cached;
    const C = ScreenFor(r.pathname);
    const el = React.createElement(C, { key: k });
    screenCacheRef.current.set(k, el);
    return el;
  }
  function getClonedEl(r: Route, suffix: string): React.ReactElement {
    const base = getScreenEl(r);
    // Clone so we never render the same element object in two places at once
    return React.cloneElement(base, { key: routeKeyFor(r) + '::' + suffix });
  }
  // Create a brand‑new element instance (do not reuse cache). Useful for temporary overlays.
  function makeFreshEl(r: Route, suffix: string): React.ReactElement {
    const C = ScreenFor(r.pathname);
    return React.createElement(C, { key: routeKeyFor(r) + '::fresh::' + suffix });
  }
  function makeFreshElWithProps(r: Route, suffix: string, props: any): React.ReactElement {
    const C = ScreenFor(r.pathname);
    return React.createElement(C, { key: routeKeyFor(r) + '::fresh::' + suffix, ...props });
  }
  const currentEl = getScreenEl(top);
  const homeRoute: Route = { pathname: '/' };
  const homeEl = getScreenEl(homeRoute);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Track previous route to coordinate custom slide transitions
  const prevKeyRef = React.useRef<string | null>(null);
  const prevRouteRef = React.useRef<Route | null>(null);

  // Slide-out animation for specific transitions: Home -> Quiz*
  const [outgoing, setOutgoing] = React.useState<Route | null>(null);
  const slideRef = React.useRef(new Animated.Value(0));
  const suppressFlashRef = React.useRef(false);
  // Vertical gesture animation (Home <-> Translate)
  const [outgoingVert, setOutgoingVert] = React.useState<Route | null>(null);
  const slideVertRef = React.useRef(new Animated.Value(0));
  const vertDirRef = React.useRef<'up' | 'down' | null>(null);

  function shouldSlideLeft(_prev: Route | null, _next: Route): boolean {
    // Keep disabled for legacy outgoing animation path
    return false;
  }

  function shouldSlideVert(_prev: Route | null, _next: Route): 'up' | 'down' | null {
    // Disabled because Translate renders its own bottom-sheet animation
    return null;
  }

  React.useEffect(() => {
    // Detect route change
    const prevKey = prevKeyRef.current;
    const prevRoute = prevRouteRef.current;
    const changed = !!prevKey && prevKey !== key;

    const vert = changed ? shouldSlideVert(prevRoute, top) : null;
    if (changed && vert) {
      setOutgoingVert(prevRoute || null);
      vertDirRef.current = vert;
      try {
        slideVertRef.current.setValue(0);
        Animated.timing(slideVertRef.current, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setOutgoingVert(null);
          vertDirRef.current = null;
        });
      } catch {
        setOutgoingVert(null);
        vertDirRef.current = null;
      }
    } else if (changed && shouldSlideLeft(prevRoute, top)) {
      // Prepare outgoing snapshot of previous route to slide left
      setOutgoing(prevRoute || null);
      try {
        suppressFlashRef.current = true;
        slideRef.current.setValue(0);
        Animated.timing(slideRef.current, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setOutgoing(null);
          suppressFlashRef.current = false;
        });
      } catch {
        setOutgoing(null);
        suppressFlashRef.current = false;
      }
    }

    prevKeyRef.current = key;
    prevRouteRef.current = top;
  }, [key]);

  // Outgoing layer if sliding
  const outgoingEl = outgoing ? getScreenEl(outgoing) : null;
  const outgoingVertEl = outgoingVert ? getScreenEl(outgoingVert) : null;

  // Prewarm disabled to keep startup and navigation snappy in development
  React.useEffect(() => {}, [top.pathname]);

  // Background preloading & local-first caching based on current route
  React.useEffect(() => {
    PreloadService.preloadForRoute(top.pathname).catch(() => {});
  }, [top.pathname]);

  // Interactive back-swipe disabled to ensure stability. Use header back/taps.

  const overlayPaths = new Set<string>(['/translate']);
  const isSheetOverlay = overlayPaths.has(top.pathname) && !!prevRoute;
  const basePath = top.pathname || '/';
  const isActive = (key: string) => {
    if (key === 'home') return basePath === '/';
    if (key === 'quiz') return basePath.startsWith('/quiz');
    if (key === 'story') return basePath.startsWith('/story');
    if (key === 'ielts') return basePath.startsWith('/ielts');
    if (key === 'account') return basePath.startsWith('/profile') || basePath.startsWith('/stats') || basePath.startsWith('/journal');
    return false;
  };
  const navItems = [
    { key: 'home', label: 'Home', icon: require('../assets/homepageicons/11.png'), go: () => ctx.setStack([{ pathname: '/' }]) },
    { key: 'story', label: 'Story', icon: require('../assets/homepageicons/13.png'), go: () => ctx.setStack([{ pathname: '/story/StoryExercise' }]) },
    { key: 'quiz', label: 'Learn', icon: require('../assets/homepageicons/12.png'), go: () => ctx.setStack([{ pathname: '/quiz/learn' }]) },
    { key: 'ielts', label: 'IELTS', icon: require('../assets/homepageicons/14.png'), go: () => ctx.setStack([{ pathname: '/ielts' }]) },
    { key: 'account', label: 'Profile', icon: require('../assets/homepageicons/15.png'), go: () => ctx.setStack([{ pathname: '/profile' }]) },
  ] as const;
  // Bottom-sheet style overlay for Translate
  const sheetAnim = React.useRef(new Animated.Value(0)).current; // 0 closed, 1 open
  const sheetClosingRef = React.useRef(false);
  const [sheetRoute, setSheetRoute] = React.useState<Route | null>(null);
  const closeSheet = React.useCallback(() => {
    try {
      sheetClosingRef.current = true;
      Animated.timing(sheetAnim, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
        setSheetRoute(null);
        // Pop translate route from stack only if translate is currently on top
        ctx.setStack(s => {
          const topRoute = s[s.length - 1];
          if (topRoute?.pathname === '/translate' && s.length > 1) return s.slice(0, -1);
          return s;
        });
        sheetClosingRef.current = false;
      });
    } catch {
      setSheetRoute(null);
      ctx.setStack(s => {
        const topRoute = s[s.length - 1];
        if (topRoute?.pathname === '/translate' && s.length > 1) return s.slice(0, -1);
        return s;
      });
      sheetClosingRef.current = false;
    }
  }, [sheetAnim, ctx]);
  const sheetPan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => {
        const vertical = Math.abs(g.dy) > Math.abs(g.dx);
        const pullingDown = g.dy > 8;
        const atTop = (globalThis as any).__SHEET_AT_TOP === true;
        const locked = (globalThis as any).__SHEET_LOCKED === true;
        return vertical && pullingDown && atTop && !locked;
      },
      onPanResponderMove: (_e, g) => {
        const v = 1 - Math.max(0, g.dy) / Math.max(1, screenHeight * 0.9);
        sheetAnim.setValue(Math.max(0, Math.min(1, v)));
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 140 || g.vy > 1) {
          closeSheet();
        } else {
          Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
        }
      },
    })
  ).current;
  React.useEffect(() => {
    // Open overlay when navigating Home -> overlay path (translate or story)
    const from = prevRoute;
    const to = top;
    const toIsOverlay = overlayPaths.has(to.pathname);
    const fromIsOverlay = overlayPaths.has(from?.pathname || '');
    // Always open overlay when navigating to an overlay route (Translate or Story sheet),
    // even if coming from another overlay.
    const open = toIsOverlay;
    // Close overlay when leaving an overlay path to ANY other route
    const close = fromIsOverlay && !toIsOverlay;
    if (open) {
      setSheetRoute(to);
      try {
        sheetAnim.setValue(0);
        // Slower, smoother slide-up for overlay sheets (Translate & Story Exercise)
        Animated.timing(sheetAnim, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      } catch {}
    } else if (close && !sheetClosingRef.current) {
      // Keep the previous overlay route visible while sliding down
      setSheetRoute(from || { pathname: '/translate' });
      try {
        sheetAnim.setValue(1);
        Animated.timing(sheetAnim, { toValue: 0, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setSheetRoute(null));
      } catch { setSheetRoute(null); }
    }
  }, [key]);

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener('OPEN_TRANSLATE_OVERLAY', () => {
      const route: Route = { pathname: '/translate' };
      setSheetRoute(route);
      try {
        sheetAnim.setValue(0);
        Animated.timing(sheetAnim, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      } catch {}
    });
    return () => sub.remove();
  }, [sheetAnim]);

  // Scale pulse for active nav item to reduce visual flash on tab switch
  const navScalesRef = React.useRef<Record<string, Animated.Value>>({});
  const getNavScale = (k: string) => {
    if (!navScalesRef.current[k]) navScalesRef.current[k] = new Animated.Value(1);
    return navScalesRef.current[k];
  };
  const dockWidth = 68;
  React.useEffect(() => {
    navItems.forEach(item => {
      const v = getNavScale(item.key);
      const active = isActive(item.key);
      try {
        Animated.spring(v, { toValue: active ? 1.08 : 1, useNativeDriver: true, friction: 6, tension: 140 }).start();
      } catch {
        try { v.setValue(active ? 1.08 : 1); } catch {}
      }
    });
  }, [basePath, navItems]);

  const showHomeBase =
    top.pathname === '/' ||
    (!!sheetRoute && prevRoute?.pathname === '/');

  // Horizontal dock (bottom) – no edge swipe; we animate in/out with translateY
  const dockPan = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => false,
    })
  ).current;

  return (
    <View style={{ flex: 1 }}>
      {/* Render previous (under) and current (over) with stable keys to preserve instances */}
      {/* Underlay: render previous only when no separate outgoing overlay is animating */}
      {prevRoute && !outgoing && !sheetRoute ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // No parallax when swipe is disabled
          }}
        >
          {getClonedEl(prevRoute, 'underlay')}
        </Animated.View>
      ) : null}

      {/* Keep Home mounted; also show it beneath Translate overlay */}
      <View style={{ flex: 1, display: showHomeBase ? 'flex' : 'none' }}>
        {homeEl}
      </View>
      <View style={{ flex: 1, display: showHomeBase ? 'none' : 'flex' }}>
        {/* When showing overlay, keep previous screen as base (unless it's Home, which is shown above) */}
        {isSheetOverlay && prevRoute ? (prevRoute.pathname === '/' ? null : getClonedEl(prevRoute, 'base-prev')) : currentEl}
      </View>

      {/* Outgoing (previous) screen sliding left when applicable */}
      {!sheetRoute && outgoing && outgoingEl ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [
              {
                translateX: slideRef.current.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -screenWidth],
                }),
              },
            ],
          }}
          pointerEvents="none"
        >
          {getClonedEl(outgoing, 'outgoing')}
        </Animated.View>
      ) : null}

      {/* Outgoing vertical slide for three‑finger gesture (Home <-> Translate) */}
      {!sheetRoute && outgoingVert && outgoingVertEl ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [
              {
                translateY: slideVertRef.current.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, vertDirRef.current === 'up' ? -screenHeight : screenHeight],
                }),
              },
            ],
          }}
          pointerEvents="none"
        >
          {getClonedEl(outgoingVert, 'outgoing-vert')}
        </Animated.View>
      ) : null}

      {/* Translate / StoryExercise bottom-sheet overlay */}
      {sheetRoute ? (
        <Animated.View
          pointerEvents="auto"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end',
            backgroundColor: sheetAnim.interpolate({ inputRange: [0,1], outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)'] }) }}
        >
          {(() => {
            // Reduce sheet height by ~10% from prior (92% -> 82%)
            const sheetHeight = Math.max(500, Math.floor(screenHeight * 0.87));
            return (
              <Animated.View
                style={{ transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0,1], outputRange: [sheetHeight, 0] }) }],
                  backgroundColor: 'transparent', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', height: sheetHeight }}
                {...sheetPan.panHandlers}
              >
                {/* No visual handle — remove top white band completely */}
                <View style={{ height: 0 }} />
                <TouchableOpacity
                  onPress={closeSheet}
                  accessibilityLabel="Close"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    backgroundColor: themeName === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.9)',
                    borderWidth: 1,
                    borderColor: themeName === 'light' ? '#E5E7EB' : '#334155',
                    zIndex: 999,
                    elevation: 12,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: themeName === 'light' ? '#111827' : '#E5E7EB' }}>✕</Text>
                </TouchableOpacity>
                {getClonedEl(sheetRoute, 'translate-overlay')}
              </Animated.View>
            );
          })()}
        </Animated.View>
      ) : null}

      {/* No translate overlay; handled by flip animation */}

      {/* Microflash overlay removed per request */}

      {/* Microflash overlay removed per request */}

      {/* Bottom nav */}
      <Animated.View
        pointerEvents={navHidden ? 'none' : 'auto'}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 8,
          zIndex: 50,
          borderRadius: 26,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: themeName === 'light' ? 0.1 : 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: themeName === 'light' ? 14 : 16,
          transform: [{ translateY: navAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) }],
          opacity: navAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        }}
        {...dockPan.panHandlers}
      >
        <View style={{ borderRadius: 18, overflow: 'hidden' }}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: themeName === 'light' ? 'rgba(255,255,255,0.78)' : 'rgba(12,14,16,0.78)',
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: themeName === 'light' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.1)',
              shadowColor: '#000',
              shadowOpacity: themeName === 'light' ? 0.06 : 0.18,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: themeName === 'light' ? 12 : 14,
            }}
          >
          {navItems.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              onPress={item.go}
              activeOpacity={0.75}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 2 }}
            >
              {(() => {
                const active = isActive(item.key);
                return (
              <Animated.View
                style={{
                  paddingHorizontal: 8,
                  paddingTop: 2,
                  paddingBottom: 0,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: active ? 3 : 0,
                  borderColor: active ? '#F8B070' : 'transparent',
                  opacity: 1,
                  transform: [
                    { scale: getNavScale(item.key) },
                  ],
                }}
              >
                <Image source={item.icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                <Text style={{ marginTop: 1, fontSize: 9.5, fontWeight: '700', color: themeName === 'light' ? '#0F172A' : '#E5E7EB' }}>
                  {item.label}
                </Text>
              </Animated.View>
                );
              })()}
            </TouchableOpacity>
          ))}
          </View>
        </View>
      </Animated.View>

      {/* StoryExercise now also uses the same bottom-sheet overlay via sheetRoute */}
    </View>
  );
}

type LinkProps = {
  href: string | { pathname: string; params?: Record<string, any> };
  asChild?: boolean;
  children: any;
};

function buildPath(href: LinkProps['href']): string {
  if (typeof href === 'string') return href;
  const { pathname, params } = href;
  if (!params) return pathname;
  // Basic support for dynamic segment [id]
  if (pathname.includes('[id]') && params.id != null) {
    return pathname.replace('[id]', String(params.id));
  }
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as any)}`)
    .join('&');
  return qs ? `${pathname}?${qs}` : pathname;
}

export function Link({ href, asChild, children }: LinkProps) {
  const router = useRouter();
  const path = buildPath(href);
  const { TouchableOpacity } = require('react-native');
  if (asChild && React.isValidElement(children)) {
    const origOnPress: any = (children as any).props?.onPress;
    return React.cloneElement(children, {
      onPress: (...args: any[]) => {
        try { origOnPress?.(...args); } catch {}
        router.push(path);
      },
    });
  }
  return (
    <TouchableOpacity onPress={() => router.push(path)}>{children}</TouchableOpacity>
  );
}

export default { useRouter, useLocalSearchParams, Stack, RouterProvider, RouteRenderer, useRouteKey, usePathname };
