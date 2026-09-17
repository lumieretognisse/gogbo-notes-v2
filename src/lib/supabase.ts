import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Récupération sécurisée des variables d'environnement Vite
const env = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env || {};
const supabaseUrl = 
  env.VITE_SUPABASE_URL || 
  env.NEXT_PUBLIC_SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  env.VITE_SUPABASE_ANON_KEY || 
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return clientInstance;
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: "Variables Supabase non configurées dans l'environnement (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Utilisation du stockage local persistant actif.",
    };
  }

  try {
    const { error } = await client.from('classes').select('count', { count: 'exact', head: true });
    if (error) {
      return { ok: false, message: `Erreur Supabase: ${error.message}` };
    }
    return { ok: true, message: 'Connexion à PostgreSQL / Supabase réussie.' };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Échec de connexion Supabase: ${errMsg}` };
  }
}
