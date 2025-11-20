import React from 'react';
import { useRouter, useRouteKey } from './router';

export function useNavigation<T = any>(): any {
  const router = useRouter();
  return React.useMemo(
    () => ({
      goBack: () => router.back(),
      navigate: (path: string) => router.push(path as any),
      replace: (path: string) => router.replace(path as any),
      setOptions: (_: any) => {},
    }),
    [router]
  );
}

export function useFocusEffect(effect: React.EffectCallback) {
  const key = useRouteKey();
  React.useEffect(effect, [key]);
}

export default { useNavigation, useFocusEffect };
