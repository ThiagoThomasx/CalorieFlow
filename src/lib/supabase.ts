import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Indica se as variáveis de ambiente do Supabase estão presentes. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Client único do Supabase. `null` quando as envs não existem —
 * nesse caso a UI mostra instruções em vez de quebrar.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Supabase não configurado. Crie o arquivo .env.local com as credenciais (veja o README).'

/** Retorna o client ou falha com mensagem clara — uso interno dos repositories. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE)
  }
  return supabase
}

/** Traduz os erros mais comuns do Supabase Auth para pt-BR. */
export function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'E-mail ou senha incorretos.'
  }
  if (/already registered|already exists/i.test(message)) {
    return 'Este e-mail já está cadastrado. Tente entrar.'
  }
  if (/password should be at least/i.test(message)) {
    return 'A senha precisa ter pelo menos 6 caracteres.'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  }
  if (/rate limit|too many requests/i.test(message)) {
    return 'Muitas tentativas. Aguarde um instante e tente novamente.'
  }
  if (/invalid email|unable to validate email/i.test(message)) {
    return 'Informe um e-mail válido.'
  }
  if (/failed to fetch|network/i.test(message)) {
    return 'Sem conexão com o servidor. Verifique sua internet.'
  }
  return message
}
