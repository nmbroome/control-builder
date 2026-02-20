/**
 * static-vocabulary.js
 * 
 * Data the Control Builder needs that is NOT derived from the OpenAPI spec.
 * These are structural patterns, regulatory citations, role lists, and
 * naming conventions that the legal team uses when authoring controls.
 * 
 * This file is manually maintained. The spec-derived vocabulary
 * (events, fields, entities) comes from vocabulary.json via the parser.
 */

export const STATIC_VOCABULARY = {
  sla_patterns: {
    'calendar_days': { description: 'N calendar days from trigger', params: ['days', 'from_event'] },
    'business_days': { description: 'N business days from trigger', params: ['days', 'from_event'] },
    'hours': { description: 'N hours from trigger', params: ['hours', 'from_event'] },
    'before_event': { description: 'Must complete before event', params: ['blocking_event'], blocking: true },
    'immediate': { description: 'Must happen immediately', params: [] },
    'quarterly': { description: 'Quarterly deadline', params: ['days_after_quarter_end'] },
    'annual': { description: 'Annual review required', params: [] },
  },

  regulations: {
    '12 CFR §721.3': { vocabulary_key: '12_cfr_721.3', name: 'NCUA CDA Regulation' },
    '26 U.S.C. §501': { vocabulary_key: '26_usc_501', name: 'Tax-Exempt Organizations' },
    '12 CFR Part 1002': { vocabulary_key: 'ecoa_reg_b', name: 'ECOA / Regulation B' },
    '15 U.S.C. §1681': { vocabulary_key: 'fcra', name: 'Fair Credit Reporting Act' },
    '42 U.S.C. §3605': { vocabulary_key: 'fha', name: 'Fair Housing Act' },
    '12 CFR Part 1026': { vocabulary_key: 'reg_z', name: 'TILA / Regulation Z' },
    '31 CFR Part 1020': { vocabulary_key: 'bsa_aml', name: 'Bank Secrecy Act / AML' },
    '31 CFR Part 501': { vocabulary_key: 'ofac', name: 'OFAC Sanctions' },
    '12 CFR Part 748': { vocabulary_key: 'ncua_748', name: 'NCUA Security Program' },
    '12 CFR Part 701': { vocabulary_key: 'ncua_701', name: 'NCUA FCU Regulations' },
  },

  roles: [
    'compliance_analyst',
    'compliance_officer',
    'fair_lending_officer',
    'bsa_officer',
    'underwriter',
    'loan_officer',
    'marketing_manager',
    'ciso',
    'cfo',
    'controller',
    'board',
    'alco',
    'legal',
    'tprm',
  ],

  audit_suffixes: [
    '.created',
    '.approved',
    '.rejected',
    '.filed',
    '.sent',
    '.blocked',
    '.override',
    '.published',
    '.issued',
    '.migrated',
    '.suspended',
    '.amended',
    '.updated',
  ],
};