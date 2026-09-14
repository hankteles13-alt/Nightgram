import { supabase } from './supabase';

// Compatibility helpers for the remaining legacy Firestore-shaped call sites.
// New authentication and phone data use Supabase Auth/Postgres directly.
export const db = supabase;
export const doc = (_db: any, table: string, id: string) => ({ table, id });
export const getDoc = async (ref: { table: string; id: string }) => {
  const { data, error } = await supabase.from(ref.table).select('*').eq('id', ref.id).maybeSingle();
  if (error) throw error;
  return { exists: () => !!data, data: () => data };
};
export const setDoc = async (ref: { table: string; id: string }, value: Record<string, any>) => {
  const { error } = await supabase.from(ref.table).upsert({ ...value, id: ref.id });
  if (error) throw error;
};
export const getDocs = async (table: string) => {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return { docs: (data || []).map((row: any) => ({ id: row.id, data: () => row })) };
};
