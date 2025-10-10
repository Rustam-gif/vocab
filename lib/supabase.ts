import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Use the React Native/browser-friendly ESM build explicitly to avoid Metro
// resolving the Node CJS bundle (dist/main), which causes resolution errors.
import { createClient } from '@supabase/supabase-js/dist/module/index.js';

const supabaseUrl = 'https://auirkjgyattnvqaygmfo.supabase.co';
const supabaseAnonKey = 'sb_publishable_rLA39DG5pwlN9VZcA5jerg_q-WTqd0m';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type SupabaseClient = typeof supabase;
