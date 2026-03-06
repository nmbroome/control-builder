/**
 * vocabulary-adapter.js
 *
 * Transforms the vocabulary parser output (vocabulary.json) into the
 * shape the Control Builder UI expects.
 *
 * Parser output (entity-scoped, event-driven):
 *   { fields: [...], events: [...], entities: [...], endpoints: [...] }
 *
 * UI expected shape:
 *   { events: { [id]: { description, category } },
 *     fields: { [id]: { type, description, category, pii } },
 *     sla_patterns: {...}, regulations: {...}, roles: [...], audit_suffixes: [...] }
 */

/**
 * Transform parser vocabulary JSON into UI vocabulary shape.
 *
 * @param {object} parserOutput - Raw vocabulary.json from extract-vocab
 * @param {object} staticData - Non-spec-derived data (sla_patterns, regulations, roles, audit_suffixes)
 * @returns {object} Vocabulary in the shape the Control Builder expects
 */
export function adaptVocabulary(parserOutput, staticData = {}) {
  const events = {};
  const fields = {};

  // ── Events: array → keyed object ─────────────────────────────────
  // Category derived from event name prefix (member.created → "member")
  for (const evt of parserOutput.events || []) {
    events[evt.name] = {
      description: evt.description || null,
      category: evt.name.split('.')[0],
      carries: evt.carries || [],
      emitted_by: evt.emitted_by_endpoints || evt.emitted_by || [],
      source_entity: evt.source_entity || null,
      trigger_type: evt.trigger_type || null,
      bound_controls: evt.bound_controls || [],
    };
  }

  // ── Fields: array → keyed object ─────────────────────────────────
  // Category is the entity name (person, campaign, cash_activity, etc.)
  for (const field of parserOutput.fields || []) {
    fields[field.path] = {
      type: field.type || 'string',
      description: field.description || null,
      category: field.category || field.entity || 'other',
      pii: field.pii || false,
      pii_classification: field.pii_classification || null,
      fair_lending_risk: field.fair_lending_risk || false,
      encryption: field.encryption || null,
      retention: field.retention || null,
      required: field.required || false,
      readOnly: field.readOnly || false,
      writeOnly: field.writeOnly || false,
      computed: field.is_computed || field.computed || false,
      controls: field.bound_controls || field.controls || [],
      entity: field.entity,
    };

    // Carry over enum values for display/validation
    if (field.enum_values || field.enum) {
      fields[field.path].enum = field.enum_values || field.enum;
    }

    // Carry over format
    if (field.format) {
      fields[field.path].format = field.format;
    }
  }

  // ── Entities: normalize to object if provided as array ───────────
  let entities = parserOutput.entities || {};
  if (Array.isArray(entities)) {
    const entityMap = {};
    for (const entity of entities) {
      entityMap[entity.name || entity.domain_name] = entity;
    }
    entities = entityMap;
  }

  return {
    // Spec-derived
    events,
    fields,

    // Metadata from parser
    meta: parserOutput.meta || {},
    entities,
    controls: parserOutput.controls || [],
    endpoints: parserOutput.endpoints || [],
    stats: parserOutput.stats || {},
    state_machines: parserOutput.state_machines || [],

    // Static data (not derived from spec)
    sla_patterns: staticData.sla_patterns || {},
    regulations: staticData.regulations || {},
    roles: staticData.roles || [],
    audit_suffixes: staticData.audit_suffixes || [],
  };
}

/**
 * Fetch vocabulary.json from a URL and transform it.
 * 
 * @param {string} vocabUrl - URL to vocabulary.json (e.g., '/vocabulary.json')
 * @param {object} staticData - Non-spec-derived data
 * @returns {Promise<object>} Transformed vocabulary
 */
export async function loadVocabulary(vocabUrl = '/vocabulary.json', staticData = {}) {
  const response = await fetch(vocabUrl);
  if (!response.ok) {
    throw new Error(`Failed to load vocabulary: ${response.status} ${response.statusText}`);
  }
  const parserOutput = await response.json();
  return adaptVocabulary(parserOutput, staticData);
}