/**
 * Client Supabase.
 *
 * Les deux valeurs viennent du fichier .env à la racine du projet :
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
 *
 * Tant que ces variables sont absentes, l'app fonctionne en mode démo
 * (données en mémoire) : voir src/lib/api.js.
 * La clé "anon" est publique par nature, elle peut vivre dans l'app.
 * La clé secrète Anthropic, elle, ne doit JAMAIS être ici (voir src/lib/ai.js).
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/** true si l'app est reliée à une vraie base Supabase. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = hasSupabase
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
