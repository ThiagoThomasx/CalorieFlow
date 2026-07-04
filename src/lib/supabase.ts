import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Indica se as variáveis de ambiente do Supabase estão presentes.
 * O app funciona 100% em modo mock quando não estão.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Client único do Supabase. `null` quando o projeto ainda não foi
 * configurado — nunca deixe o app quebrar por falta de envs.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null

interface AuthResult {
  ok: boolean
  message: string
}

/**
 * Login por e-mail/senha. Usa Supabase quando configurado;
 * caso contrário retorna sucesso mockado para a Sprint 1.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!supabase) {
    return { ok: true, message: 'Sessão mock iniciada (Supabase não configurado).' }
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Login realizado com sucesso.' }
}

/**
 * Registro por e-mail/senha. Mesma regra de fallback do login.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!supabase) {
    return { ok: true, message: 'Conta mock criada (Supabase não configurado).' }
  }
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Conta criada. Verifique seu e-mail.' }
}

/** Encerra a sessão atual quando o Supabase está ativo. */
export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut()
}
