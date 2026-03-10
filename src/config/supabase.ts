import { createClient } from '@supabase/supabase-js';
import { validateEnv } from './env';

const env = validateEnv();

// Public client for general operations
// flowType is set to 'implicit' because the OAuth URL is generated server-side:
// with PKCE (the default), supabase-js stores the code_verifier in memory during
// the request, but that memory is gone by the time Supabase redirects the user
// back with ?code=..., so the frontend can never exchange the code for tokens.
// The implicit flow instead returns tokens directly in the URL hash (#access_token=...)
// which the frontend's supabase client can read via detectSessionInUrl.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    flowType: 'implicit',
  },
});

// Admin client for privileged operations
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
