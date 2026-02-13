// VOCABULARY - Engineering owns this data
export const VOCABULARY = {
  events: {
    // CDA Events
    'cda.policy_approved': { description: 'CDA policy approved by board', category: 'cda' },
    'cda.board_packet.sent': { description: 'Board packet sent for CDA review', category: 'cda' },
    'cda.glossary.updated': { description: 'CDA glossary terms updated', category: 'cda' },
    'cda.account.created': { description: 'CDA account created', category: 'cda' },
    'cda.vendor.onboarded': { description: 'CDA vendor onboarded', category: 'cda' },
    'cda.vendor.reviewed': { description: 'CDA vendor annual review completed', category: 'cda' },
    'cda.contract.drafted': { description: 'CDA contract drafted', category: 'cda' },
    'cda.contract.executed': { description: 'CDA contract executed', category: 'cda' },
    // Member Events
    'member.created': { description: 'New member record created', category: 'member' },
    'member.updated': { description: 'Member profile changed', category: 'member' },
    // Lending Events
    'application.created': { description: 'Loan/membership application submitted', category: 'lending' },
    'application.completed': { description: 'Application has all required info', category: 'lending' },
    'decision.recorded': { description: 'Credit decision made', category: 'lending' },
    // Compliance Events
    'kyc.started': { description: 'Identity verification initiated', category: 'compliance' },
    'kyc.passed': { description: 'Identity verification successful', category: 'compliance' },
    'kyc.failed': { description: 'Identity verification failed', category: 'compliance' },
    'screening.ofac.hit': { description: 'OFAC screening potential match', category: 'compliance' },
    'screening.ofac.cleared': { description: 'OFAC match cleared', category: 'compliance' },
    // BSA Events
    'cash.threshold.exceeded': { description: 'Cash transactions exceed $10k', category: 'bsa' },
    'sar.decision.required': { description: 'Case requires SAR decision', category: 'bsa' },
    'sar.filed': { description: 'SAR submitted to FinCEN', category: 'bsa' },
    // Marketing Events
    'campaign.created': { description: 'Marketing campaign submitted', category: 'marketing' },
    'campaign.approved': { description: 'Campaign cleared for launch', category: 'marketing' },
    'campaign.launched': { description: 'Campaign went live', category: 'marketing' },
  },
  fields: {
    // CDA Fields
    'cda.policy.version': { type: 'string', description: 'CDA policy version identifier', category: 'cda' },
    'cda.policy.dates': { type: 'object', description: 'Policy effective/expiration dates', category: 'cda' },
    'cda.policy.approvers': { type: 'array', description: 'List of policy approvers', category: 'cda' },
    'cda.glossary.items[]': { type: 'array', description: 'Glossary term definitions', category: 'cda' },
    'cda.account.type': { type: 'enum', description: 'Account structure type (custodial/SPE/trust)', category: 'cda' },
    'cda.account.legal_name': { type: 'string', description: 'Legal name of CDA account', category: 'cda' },
    'cda.account.trustee_id': { type: 'string', description: 'Trustee identifier', category: 'cda' },
    'cda.vendor.reg_status': { type: 'enum', description: 'Vendor regulatory status', category: 'cda' },
    'cda.vendor.adv_uri': { type: 'string', description: 'SEC ADV filing URI', category: 'cda' },
    'cda.vendor.docs[]': { type: 'array', description: 'Vendor documentation', category: 'cda' },
    'cda.contract.named_charities[]': { type: 'array', description: 'Named qualified charities', category: 'cda' },
    'cda.contract.strategy_text': { type: 'string', description: 'Investment strategy description', category: 'cda' },
    'cda.contract.gaap_clause': { type: 'string', description: 'GAAP accounting clause text', category: 'cda' },
    'cda.contract.dist_frequency': { type: 'enum', description: 'Distribution frequency', category: 'cda' },
    // Member Fields
    'member_id': { type: 'string', description: 'Unique member identifier', category: 'member', pii: false },
    'member.name': { type: 'string', description: 'Member legal name', category: 'member', pii: true },
    'member.dob': { type: 'date', description: 'Date of birth', category: 'member', pii: true },
    'member.tin': { type: 'string', description: 'SSN/ITIN/EIN', category: 'member', pii: true },
    'member.address': { type: 'object', description: 'Member address', category: 'member', pii: true },
    'member.email': { type: 'string', description: 'Email address', category: 'member', pii: true },
    // Lending Fields
    'application_id': { type: 'string', description: 'Application identifier', category: 'lending' },
    'application_type': { type: 'enum', description: 'Type of application', category: 'lending' },
    'decision_type': { type: 'enum', description: 'Credit decision outcome', category: 'lending' },
    'adverse_reasons': { type: 'array', description: 'Reasons for adverse action', category: 'lending' },
    'credit.fico_score': { type: 'integer', description: 'FICO credit score', category: 'credit' },
    'credit.dti_ratio': { type: 'number', description: 'Debt-to-income ratio', category: 'credit' },
  },
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
    '12_cfr_721.3': { name: 'NCUA CDA Regulation', citation: '12 CFR §721.3' },
    '26_usc_501': { name: 'Tax-Exempt Organizations', citation: '26 U.S.C. §501' },
    'ecoa_reg_b': { name: 'ECOA / Regulation B', citation: '12 CFR Part 1002' },
    'fcra': { name: 'Fair Credit Reporting Act', citation: '15 U.S.C. §1681' },
    'fha': { name: 'Fair Housing Act', citation: '42 U.S.C. §3605' },
    'reg_z': { name: 'TILA / Regulation Z', citation: '12 CFR Part 1026' },
    'bsa_aml': { name: 'Bank Secrecy Act / AML', citation: '31 CFR Part 1020' },
    'ofac': { name: 'OFAC Sanctions', citation: '31 CFR Part 501' },
    'ncua_748': { name: 'NCUA Security Program', citation: '12 CFR Part 748' },
    'ncua_701': { name: 'NCUA FCU Regulations', citation: '12 CFR Part 701' },
  },
  roles: ['compliance_analyst', 'compliance_officer', 'fair_lending_officer', 'bsa_officer', 'underwriter', 'loan_officer', 'marketing_manager', 'ciso', 'cfo', 'controller', 'board', 'alco', 'legal', 'tprm'],
  audit_suffixes: ['.created', '.approved', '.rejected', '.filed', '.sent', '.blocked', '.override', '.published', '.issued', '.migrated', '.suspended', '.amended', '.updated']
};
