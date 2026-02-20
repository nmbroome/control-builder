/**
 * vocabulary.js
 * 
 * Replaced: was a hardcoded static vocabulary. Now provides:
 *   1. EMPTY_VOCABULARY — a fallback shape for before async load completes
 *   2. Re-exports loadVocabulary and STATIC_VOCABULARY for the app to use
 * 
 * The real vocabulary is loaded from /vocabulary.json at runtime,
 * transformed by the adapter, and merged with static data.
 */

export { loadVocabulary, adaptVocabulary } from '@/lib/vocabulary-adapter';
export { STATIC_VOCABULARY } from '@/data/static-vocabulary';

// Fallback shape so components don't crash before vocab loads
export const EMPTY_VOCABULARY = {
  events: {},
  fields: {},
  entities: {},
  controls: [],
  endpoints: [],
  stats: {},
  meta: {},
  sla_patterns: {},
  regulations: {},
  roles: [],
  audit_suffixes: [],
};