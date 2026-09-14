// Backward-compatible module name retained so the existing UI can migrate from Firebase
// without changing every import at once. All persistence now goes through Supabase.
export * from './supabaseFirestoreAdapter';
