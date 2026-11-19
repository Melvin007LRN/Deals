/** Partie en ligne (implémentée à l'étape multijoueur). */
export function onlineAvailable(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
