import yaml from 'js-yaml';

// --- Normalization helpers ---

// Extracts a clean event ID from various formats:
//   "cda.policy_approved" -> "cda.policy_approved"
//   "(board.policy.approve)" -> "board.policy.approve"
//   "Board approves new version (governance.policy_version_approved)" -> "governance.policy_version_approved"
//   "(member.industry in {{High_Risk_Industries_List}})" -> null (expression, not a simple event)
function normalizeEventId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // Try paren-wrapped extraction first (handles both pure-paren and free-text-with-parens)
  const parenMatch = trimmed.match(/\(([a-z][a-z0-9_.]+)\)/);
  if (parenMatch) return parenMatch[1];

  // Handle unclosed paren at end: "Trader enters trade (trade.entered"
  const openParen = trimmed.match(/\(([a-z][a-z0-9_.]+)$/);
  if (openParen) return openParen[1];

  // Plain dot-notation with no parens
  if (/^[a-z][a-z0-9_.]+$/.test(trimmed)) return trimmed;

  return null;
}

// Extracts clean field IDs from various formats:
//   "cda.policy.version" -> ["cda.policy.version"]
//   "(cda.policy.version)" -> ["cda.policy.version"]
//   "(decision.outcome, decision.date)" -> ["decision.outcome", "decision.date"]
//   "(cda.limit.internal_buffer = 4%)" -> ["cda.limit.internal_buffer"]
//   "loan.modification.*" -> ["loan.modification.*"]
//   "UST" -> [] (not a valid field ref)
function normalizeFieldIds(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const stripped = raw.replace(/^\(/, '').replace(/\)$/, '').trim();

  // Split on commas for compound refs
  const parts = stripped.split(',').map(s => s.trim());
  const results = [];

  for (const part of parts) {
    // Extract the field ID portion (before any = or ∈ operator)
    const beforeOp = part.split(/\s*[=∈<>]/)[0].trim();
    // Must start with lowercase letter and contain dots or underscores
    if (/^[a-z][a-z0-9_.*[\]]*$/.test(beforeOp) && (beforeOp.includes('.') || beforeOp.includes('_'))) {
      results.push(beforeOp.replace(/\[\]/g, ''));
    }
  }

  return results;
}

// Deduplicate an array preserving order
function dedupe(arr) {
  return [...new Set(arr)];
}

// --- Manifest builders ---

function controlKey(control) {
  return control.scoped_id || `${control.source_file || 'unknown'}:${control.id}`;
}

function buildControlEntries(controls) {
  const entries = {};

  for (const control of controls) {
    const triggers = dedupe(
      (control.triggers || []).map(normalizeEventId).filter(Boolean)
    );
    const inputs = dedupe(
      (control.inputs || []).flatMap(normalizeFieldIds)
    );
    const outputs = dedupe(
      (control.outputs || []).flatMap(normalizeFieldIds)
    );

    entries[controlKey(control)] = {
      id: control.id,
      name: control.name || '',
      source_file: control.source_file || '',
      purpose: control.purpose || '',
      primary_rules: control.primary_rules || [],
      triggers,
      inputs,
      outputs,
      audit_logs: control.audit_logs || [],
    };
  }

  return entries;
}

function buildReverseIndexes(controls) {
  const controlsByEvent = {};
  const controlsByInputField = {};
  const controlsByOutputField = {};

  for (const control of controls) {
    const triggers = dedupe(
      (control.triggers || []).map(normalizeEventId).filter(Boolean)
    );
    const inputs = dedupe(
      (control.inputs || []).flatMap(normalizeFieldIds)
    );
    const outputs = dedupe(
      (control.outputs || []).flatMap(normalizeFieldIds)
    );

    const key = controlKey(control);
    for (const eventId of triggers) {
      (controlsByEvent[eventId] ??= []).push(key);
    }
    for (const fieldId of inputs) {
      (controlsByInputField[fieldId] ??= []).push(key);
    }
    for (const fieldId of outputs) {
      (controlsByOutputField[fieldId] ??= []).push(key);
    }
  }

  return { controlsByEvent, controlsByInputField, controlsByOutputField };
}

function buildEventRegistry(controls, vocabulary, controlsByEvent) {
  const registry = {};
  const registeredIds = new Set(Object.keys(vocabulary.events));

  // All unique event IDs from controls + vocabulary
  const allEventIds = new Set([
    ...Object.keys(controlsByEvent),
    ...registeredIds,
  ]);

  for (const eventId of allEventIds) {
    const vocabEntry = vocabulary.events[eventId];
    registry[eventId] = {
      description: vocabEntry ? vocabEntry.description : null,
      category: vocabEntry ? vocabEntry.category : eventId.split('.')[0],
      registered: registeredIds.has(eventId),
      required_by_controls: controlsByEvent[eventId] || [],
    };
  }

  return registry;
}

function buildFieldRegistry(controls, vocabulary, controlsByInputField, controlsByOutputField) {
  const registry = {};

  // Build a normalized lookup: strip [] from vocabulary keys for matching
  const vocabByNormalized = {};
  for (const [key, val] of Object.entries(vocabulary.fields)) {
    vocabByNormalized[key.replace(/\[\]/g, '')] = val;
  }
  const registeredNormalized = new Set(Object.keys(vocabByNormalized));

  // All unique field IDs from controls + vocabulary (all normalized without [])
  const allFieldIds = new Set([
    ...Object.keys(controlsByInputField),
    ...Object.keys(controlsByOutputField),
    ...registeredNormalized,
  ]);

  for (const fieldId of allFieldIds) {
    const vocabEntry = vocabByNormalized[fieldId];
    registry[fieldId] = {
      type: vocabEntry ? vocabEntry.type : null,
      description: vocabEntry ? vocabEntry.description : null,
      category: vocabEntry ? vocabEntry.category : fieldId.split('.')[0],
      pii: vocabEntry ? (vocabEntry.pii || false) : null,
      registered: registeredNormalized.has(fieldId),
      used_as_input_by: controlsByInputField[fieldId] || [],
      used_as_output_by: controlsByOutputField[fieldId] || [],
    };
  }

  return registry;
}

function buildRegulationRegistry(controls, vocabulary) {
  const registry = {};

  // Start with vocabulary-defined regulations
  for (const [regId, regData] of Object.entries(vocabulary.regulations)) {
    registry[regData.citation] = {
      vocabulary_key: regId,
      name: regData.name,
      referenced_by_controls: [],
    };
  }

  // Walk controls and match their primary_rules to regulations
  for (const control of controls) {
    const key = controlKey(control);
    for (const rule of control.primary_rules || []) {
      // Try to find a matching vocabulary regulation
      let matched = false;
      for (const [citation, entry] of Object.entries(registry)) {
        if (rule.includes(citation) || citation.includes(rule)) {
          entry.referenced_by_controls.push(key);
          matched = true;
          break;
        }
      }
      // If no vocabulary match, create an entry for this citation
      if (!matched) {
        if (!registry[rule]) {
          registry[rule] = {
            vocabulary_key: null,
            name: null,
            referenced_by_controls: [],
          };
        }
        registry[rule].referenced_by_controls.push(key);
      }
    }
  }

  // Deduplicate control references
  for (const entry of Object.values(registry)) {
    entry.referenced_by_controls = dedupe(entry.referenced_by_controls);
  }

  return registry;
}

function buildSummary(controlEntries, eventRegistry, fieldRegistry, controls) {
  const registeredEvents = Object.values(eventRegistry).filter(e => e.registered).length;
  const unregisteredEvents = Object.values(eventRegistry).filter(e => !e.registered).length;
  const registeredFields = Object.values(fieldRegistry).filter(f => f.registered).length;
  const unregisteredFields = Object.values(fieldRegistry).filter(f => !f.registered).length;
  const sourceFiles = dedupe(controls.map(c => c.source_file).filter(Boolean));

  return {
    total_controls: Object.keys(controlEntries).length,
    total_events_required: Object.keys(eventRegistry).length,
    total_fields_required: Object.keys(fieldRegistry).length,
    registered_events: registeredEvents,
    unregistered_events: unregisteredEvents,
    registered_fields: registeredFields,
    unregistered_fields: unregisteredFields,
    source_files: sourceFiles,
  };
}

// --- Single-control preview ---

export function buildControlPreview(control, vocabulary) {
  const triggers = dedupe(
    (control.triggers || []).map(normalizeEventId).filter(Boolean)
  );
  const inputs = dedupe(
    (control.inputs || []).flatMap(normalizeFieldIds)
  );
  const outputs = dedupe(
    (control.outputs || []).flatMap(normalizeFieldIds)
  );

  // Build a normalized lookup for fields (strip [] from vocabulary keys)
  const vocabFieldsNormalized = {};
  for (const [key, val] of Object.entries(vocabulary.fields)) {
    vocabFieldsNormalized[key.replace(/\[\]/g, '')] = val;
  }

  // Classify events as registered or unregistered
  const registeredEvents = triggers.filter(t => vocabulary.events[t]);
  const unregisteredEvents = triggers.filter(t => !vocabulary.events[t]);

  // Classify fields as registered or unregistered
  const allFields = dedupe([...inputs, ...outputs]);
  const registeredFields = allFields.filter(f => vocabFieldsNormalized[f]);
  const unregisteredFields = allFields.filter(f => !vocabFieldsNormalized[f]);

  const preview = {
    [controlKey(control)]: {
      id: control.id,
      name: control.name || '',
      source_file: control.source_file || '',
      purpose: control.purpose || '',
      primary_rules: control.primary_rules || [],
      triggers,
      inputs,
      outputs,
      audit_logs: control.audit_logs || [],
    },
    vocabulary_status: {
      registered_events: registeredEvents,
      unregistered_events: unregisteredEvents,
      registered_fields: registeredFields,
      unregistered_fields: unregisteredFields,
    },
  };

  return yaml.dump(preview, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
  });
}

// --- Main export function ---

export function buildVocabularyManifest(controls, vocabulary) {
  const { controlsByEvent, controlsByInputField, controlsByOutputField } =
    buildReverseIndexes(controls);

  const controlEntries = buildControlEntries(controls);
  const eventRegistry = buildEventRegistry(controls, vocabulary, controlsByEvent);
  const fieldRegistry = buildFieldRegistry(controls, vocabulary, controlsByInputField, controlsByOutputField);
  const regulationRegistry = buildRegulationRegistry(controls, vocabulary);

  const manifest = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    generator: 'controls-builder',
    controls: controlEntries,
    events: eventRegistry,
    fields: fieldRegistry,
    regulations: regulationRegistry,
    sla_patterns: vocabulary.sla_patterns,
    roles: vocabulary.roles,
    audit_suffixes: vocabulary.audit_suffixes,
    summary: buildSummary(controlEntries, eventRegistry, fieldRegistry, controls),
  };

  return yaml.dump(manifest, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
  });
}
