import { render, screen } from '@testing-library/react';
import { RulePreview } from './RulePreview';

const emptyVocabulary = {
  events: {},
  fields: {},
};

const vocabularyWithPii = {
  events: {},
  fields: {
    'member.name': { type: 'string', description: 'Member name', category: 'member', pii: true },
    'payment.amount': { type: 'number', description: 'Amount', category: 'payment', pii: false },
  },
};

function createControl(overrides = {}) {
  return {
    id: 'BA-05',
    name: 'OFAC Screening',
    triggers: [],
    inputs: [],
    outputs: [],
    audit_logs: [],
    system_behavior: '',
    ...overrides,
  };
}

describe('RulePreview', () => {
  it('renders nothing for a completely empty control', () => {
    const { container } = render(
      <RulePreview control={createControl()} vocabulary={emptyVocabulary} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders WHEN row with trigger events', () => {
    render(
      <RulePreview
        control={createControl({ triggers: ['payment.pre.screen'] })}
        vocabulary={emptyVocabulary}
      />
    );
    expect(screen.getByTestId('rule-when')).toBeInTheDocument();
    expect(screen.getByText('payment.pre.screen')).toBeInTheDocument();
    expect(screen.getByText('fires')).toBeInTheDocument();
  });

  it('renders CHECK row with input fields', () => {
    render(
      <RulePreview
        control={createControl({ inputs: ['party.name', 'party.dob'] })}
        vocabulary={emptyVocabulary}
      />
    );
    expect(screen.getByTestId('rule-check')).toBeInTheDocument();
    expect(screen.getByText('party.name')).toBeInTheDocument();
    expect(screen.getByText('party.dob')).toBeInTheDocument();
  });

  it('renders THEN row with output fields', () => {
    render(
      <RulePreview
        control={createControl({ outputs: ['ofac.blocked', 'ofac.report.filed'] })}
        vocabulary={emptyVocabulary}
      />
    );
    expect(screen.getByTestId('rule-then')).toBeInTheDocument();
    expect(screen.getByText('ofac.blocked')).toBeInTheDocument();
    expect(screen.getByText('ofac.report.filed')).toBeInTheDocument();
  });

  it('renders LOG row with audit logs', () => {
    render(
      <RulePreview
        control={createControl({ audit_logs: ['ofac.hit.reviewed'] })}
        vocabulary={emptyVocabulary}
      />
    );
    expect(screen.getByTestId('rule-log')).toBeInTheDocument();
    expect(screen.getByText('ofac.hit.reviewed')).toBeInTheDocument();
  });

  it('renders DO row with system behavior', () => {
    render(
      <RulePreview
        control={createControl({ system_behavior: 'Screen against OFAC SDN list' })}
        vocabulary={emptyVocabulary}
      />
    );
    expect(screen.getByTestId('rule-do')).toBeInTheDocument();
    expect(screen.getByText('Screen against OFAC SDN list')).toBeInTheDocument();
  });

  it('marks PII fields with purple styling and (PII) label', () => {
    render(
      <RulePreview
        control={createControl({ inputs: ['member.name', 'payment.amount'] })}
        vocabulary={vocabularyWithPii}
      />
    );
    // member.name is PII
    const piiSpan = screen.getByText('member.name').closest('span');
    expect(piiSpan.className).toContain('bg-purple-50');
    expect(screen.getByText('(PII)')).toBeInTheDocument();

    // payment.amount is not PII
    const normalSpan = screen.getByText('payment.amount').closest('span');
    expect(normalSpan.className).toContain('bg-gray-100');
  });

  it('handles controls with only triggers (no other fields)', () => {
    render(
      <RulePreview
        control={createControl({ triggers: ['member.created'] })}
        vocabulary={emptyVocabulary}
      />
    );
    expect(screen.getByTestId('rule-when')).toBeInTheDocument();
    expect(screen.queryByTestId('rule-check')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rule-then')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rule-log')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rule-do')).not.toBeInTheDocument();
  });

  it('renders all sections for a fully populated control', () => {
    render(
      <RulePreview
        control={createControl({
          triggers: ['payment.pre.screen'],
          inputs: ['party.name'],
          outputs: ['ofac.blocked'],
          audit_logs: ['ofac.hit.reviewed'],
          system_behavior: 'Screen against OFAC',
        })}
        vocabulary={emptyVocabulary}
      />
    );
    expect(screen.getByTestId('rule-when')).toBeInTheDocument();
    expect(screen.getByTestId('rule-check')).toBeInTheDocument();
    expect(screen.getByTestId('rule-then')).toBeInTheDocument();
    expect(screen.getByTestId('rule-log')).toBeInTheDocument();
    expect(screen.getByTestId('rule-do')).toBeInTheDocument();
    expect(screen.getByText('Rule Summary')).toBeInTheDocument();
  });

  it('strips parentheses from input field IDs', () => {
    render(
      <RulePreview
        control={createControl({ inputs: ['(party.name)'] })}
        vocabulary={emptyVocabulary}
      />
    );
    expect(screen.getByText('party.name')).toBeInTheDocument();
  });
});
