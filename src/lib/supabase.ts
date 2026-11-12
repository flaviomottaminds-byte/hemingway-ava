import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://prnwtlpopoeymcamtcja.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_aK8oN-V_q9DKkr0Wijslcw_kBvM3sll'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas. Verifique o arquivo .env',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
