/**
 * control-normalizer.js
 *
 * Normalizes controls from the new structured format into the flat
 * shape the Control Builder UI components expect.
 *
 * New format (from cleaned_controls.json):
 *   triggers: [{ event, human_action }]
 *   inputs:   [{ field, required, notes }]
 *   outputs:  [{ field, required, notes }]
 *   regulations: [{ id, section }]
 *   slas:     [{ description, pattern, params }]
 *   audit_events: [string]
 *   access:   { edit: [], view: [], approve: [] }
 *   description: string
 *
 * Old/UI format:
 *   triggers:       [string]
 *   inputs:         [string]
 *   outputs:        [string]
 *   primary_rules:  [string]
 *   timers_slas:    string
 *   audit_logs:     [string]
 *   access_control: string
 *   purpose:        string
 *   scoped_id:      string
 */

/**
 * Normalize a single control from the new structured format
 * to the flat format the UI expects. Preserves the original
 * structured data under a `_structured` key.
 *
 * @param {object} raw - Control in new format
 * @returns {object} Control in UI-expected format
 */
export function normalizeControl(raw) {
  // Already normalized (has purpose or primary_rules as strings) — return as-is
  if (typeof raw.purpose === 'string' && raw.purpose !== undefined && !raw.description) {
    return raw;
  }

  // ── Triggers: { event, human_action }[] → string[] ───────────────
  const triggers = (raw.triggers || []).map((t) =>
    typeof t === 'string' ? t : t.event || ''
  );

  // ── Inputs: { field, required, notes }[] → string[] ──────────────
  const inputs = (raw.inputs || []).map((inp) =>
    typeof inp === 'string' ? inp : inp.field || ''
  );

  // ── Outputs: { field, required, notes }[] → string[] ─────────────
  const outputs = (raw.outputs || []).map((out) =>
    typeof out === 'string' ? out : out.field || ''
  );

  // ── Regulations: { id, section }[] → string[] (primary_rules) ────
  const primary_rules = (raw.regulations || []).map((reg) =>
    typeof reg === 'string' ? reg : reg.id || ''
  );

  // ── SLAs: { description, pattern, params }[] → string ────────────
  const timers_slas = (raw.slas || [])
    .map((sla) => (typeof sla === 'string' ? sla : sla.description || ''))
    .filter(Boolean)
    .join('; ');

  // ── Audit events → audit_logs ────────────────────────────────────
  const audit_logs = raw.audit_events || raw.audit_logs || [];

  // ── Access: { edit, view, approve } → string ─────────────────────
  let access_control = raw.access_control || '';
  if (raw.access && typeof raw.access === 'object') {
    const parts = [];
    if (raw.access.edit?.length) parts.push(`Edit: ${raw.access.edit.join(', ')}`);
    if (raw.access.view?.length) parts.push(`View: ${raw.access.view.join(', ')}`);
    if (raw.access.approve?.length) parts.push(`Approve: ${raw.access.approve.join(', ')}`);
    access_control = parts.join('; ');
  }

  // ── Purpose ← description ────────────────────────────────────────
  const purpose = raw.description || raw.purpose || '';

  // ── Scoped ID: derive from source_file + id ──────────────────────
  const scoped_id = raw.scoped_id || (raw.source_file ? `${raw.source_file}:${raw.id}` : raw.id);

  return {
    id: raw.id,
    name: raw.name,
    source_file: raw.source_file || '',
    scoped_id,
    anchor: raw.anchor || '',
    purpose,
    status: raw.status || 'active',
    why_reg_cite: raw.why_reg_cite || '',
    system_behavior: raw.system_behavior || '',
    triggers,
    inputs,
    outputs,
    primary_rules,
    timers_slas,
    edge_cases: raw.edge_cases || '',
    audit_logs,
    access_control,
    alerts_metrics: raw.alerts_metrics || '',
    // Preserve original structured data for future use
    _structured: {
      triggers: raw.triggers || [],
      inputs: raw.inputs || [],
      outputs: raw.outputs || [],
      regulations: raw.regulations || [],
      slas: raw.slas || [],
      access: raw.access || {},
    },
  };
}

/**
 * Normalize a controls.json payload.
 * Handles both wrapped `{ controls: [...] }` and bare array `[...]` formats.
 *
 * @param {object|Array} data - Raw controls data
 * @returns {Array} Normalized controls array
 */
export function normalizeControls(data) {
  const rawControls = Array.isArray(data) ? data : data?.controls || [];
  return rawControls.map(normalizeControl);
}
