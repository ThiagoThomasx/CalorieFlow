import type { Profile } from '../types/user'
import { requireSupabase } from '../lib/supabase'

interface ProfileRow {
  id: string
  display_name: string | null
  avatar_url: string | null
}

/** Acesso à tabela profiles (1:1 com auth.users). */
export const profileRepository = {
  async getById(userId: string): Promise<Profile | null> {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return null

    const row = data as ProfileRow
    return {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
    }
  },
}
