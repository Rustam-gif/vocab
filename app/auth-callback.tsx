import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Prefer code exchange for session if present
        const query = params as Record<string, string>;
        const { access_token, refresh_token, code, error } = query as any;
        
        if (error) {
          console.error('OAuth error:', error);
          router.replace('/profile?error=auth_failed');
          return;
        }

        if (code && typeof code === 'string') {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Exchange code error:', exchangeError);
            router.replace('/profile?error=session_failed');
            return;
          }
          console.log('Auth successful via code:', data.user?.email);
          router.replace('/profile?success=true');
          return;
        }

        if (access_token && refresh_token) {
          // Set the session with the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            router.replace('/profile?error=session_failed');
            return;
          }

          console.log('Auth successful:', data.user?.email);
          router.replace('/profile?success=true');
        } else {
          // If no tokens, try to get session from URL hash (fallback)
          // For AuthSession proxy, tokens are not in URL hash when we return in-app
          // Just reload session normally; Supabase SDK should pick up cookies/session
          const { data: sessionRes, error: hashError } = await supabase.auth.getSession();
          if (hashError) {
            console.error('Hash session error:', hashError);
            router.replace('/profile?error=hash_failed');
          } else {
            router.replace('/profile?success=true');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/profile?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router, params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#f59f46" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121315',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
