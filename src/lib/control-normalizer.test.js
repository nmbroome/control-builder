import { normalizeControl, normalizeControls } from './control-normalizer';

describe('normalizeControl', () => {
  it('normalizes triggers from objects to strings', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      triggers: [
        { event: 'cda.policy_approved', human_action: '' },
        { event: 'cda.board_packet.sent', human_action: '' },
      ],
    };
    const result = normalizeControl(raw);
    expect(result.triggers).toEqual(['cda.policy_approved', 'cda.board_packet.sent']);
  });

  it('normalizes inputs from objects to field strings', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      inputs: [
        { field: 'cda.policy.version', required: false, notes: '' },
        { field: 'cda.policy.dates', required: true, notes: 'important' },
      ],
    };
    const result = normalizeControl(raw);
    expect(result.inputs).toEqual(['cda.policy.version', 'cda.policy.dates']);
  });

  it('normalizes outputs from objects to field strings', () => {
    const raw = {
      id: 'LC-01',
      name: 'Test',
      outputs: [{ field: 'collections.policy.snapshot', required: false, notes: '' }],
    };
    const result = normalizeControl(raw);
    expect(result.outputs).toEqual(['collections.policy.snapshot']);
  });

  it('maps regulations to primary_rules', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      regulations: [
        { id: '12 CFR §721.3(b)(2)', section: '' },
        { id: '26 U.S.C. §501', section: 'c' },
      ],
    };
    const result = normalizeControl(raw);
    expect(result.primary_rules).toEqual(['12 CFR §721.3(b)(2)', '26 U.S.C. §501']);
  });

  it('maps slas to timers_slas string', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      slas: [
        { description: 'Within 30 days', pattern: 'calendar_days', params: { days: 30 } },
        { description: 'Annual review required', pattern: 'annual', params: {} },
      ],
    };
    const result = normalizeControl(raw);
    expect(result.timers_slas).toBe('Within 30 days; Annual review required');
  });

  it('maps audit_events to audit_logs', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      audit_events: ['cda.published', 'cda.issued'],
    };
    const result = normalizeControl(raw);
    expect(result.audit_logs).toEqual(['cda.published', 'cda.issued']);
  });

  it('maps access object to access_control string', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      access: { edit: ['cfo', 'compliance'], view: [], approve: ['board'] },
    };
    const result = normalizeControl(raw);
    expect(result.access_control).toBe('Edit: cfo, compliance; Approve: board');
  });

  it('maps description to purpose', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      description: 'Board accountability; roles; reporting cadence',
    };
    const result = normalizeControl(raw);
    expect(result.purpose).toBe('Board accountability; roles; reporting cadence');
  });

  it('generates scoped_id from source_file and id', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      source_file: 'charitable-donation-accounts.md',
    };
    const result = normalizeControl(raw);
    expect(result.scoped_id).toBe('charitable-donation-accounts.md:CA-01');
  });

  it('preserves why_reg_cite and system_behavior unchanged', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      why_reg_cite: 'Some regulation text',
      system_behavior: 'Block CDA actions if policy expired',
    };
    const result = normalizeControl(raw);
    expect(result.why_reg_cite).toBe('Some regulation text');
    expect(result.system_behavior).toBe('Block CDA actions if policy expired');
  });

  it('preserves structured data under _structured key', () => {
    const raw = {
      id: 'CA-01',
      name: 'Test',
      triggers: [{ event: 'cda.policy_approved', human_action: '' }],
      inputs: [{ field: 'cda.policy.version', required: true, notes: 'critical' }],
      regulations: [{ id: '12 CFR §721.3', section: '' }],
      slas: [{ description: '30 days', pattern: 'calendar_days', params: { days: 30 } }],
      access: { edit: ['cfo'], view: [], approve: ['board'] },
    };
    const result = normalizeControl(raw);
    expect(result._structured.triggers).toEqual(raw.triggers);
    expect(result._structured.inputs).toEqual(raw.inputs);
    expect(result._structured.regulations).toEqual(raw.regulations);
    expect(result._structured.slas).toEqual(raw.slas);
    expect(result._structured.access).toEqual(raw.access);
  });

  it('handles already-normalized controls (old format)', () => {
    const old = {
      id: 'CA-01',
      name: 'Test',
      purpose: 'Board accountability',
      triggers: ['cda.policy_approved'],
      inputs: ['cda.policy.version'],
      primary_rules: ['12 CFR §721.3'],
    };
    const result = normalizeControl(old);
    // Should pass through unchanged
    expect(result.purpose).toBe('Board accountability');
    expect(result.triggers).toEqual(['cda.policy_approved']);
  });
});

describe('normalizeControls', () => {
  it('handles bare array format', () => {
    const data = [
      { id: 'CA-01', name: 'Test 1', description: 'Desc 1' },
      { id: 'CA-02', name: 'Test 2', description: 'Desc 2' },
    ];
    const result = normalizeControls(data);
    expect(result).toHaveLength(2);
    expect(result[0].purpose).toBe('Desc 1');
    expect(result[1].purpose).toBe('Desc 2');
  });

  it('handles wrapped { controls: [...] } format', () => {
    const data = {
      controls: [
        { id: 'CA-01', name: 'Test', description: 'Wrapped' },
      ],
    };
    const result = normalizeControls(data);
    expect(result).toHaveLength(1);
    expect(result[0].purpose).toBe('Wrapped');
  });

  it('returns empty array for empty input', () => {
    expect(normalizeControls([])).toEqual([]);
    expect(normalizeControls({})).toEqual([]);
    expect(normalizeControls({ controls: [] })).toEqual([]);
  });
});
