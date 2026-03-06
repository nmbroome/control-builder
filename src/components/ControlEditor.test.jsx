import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlEditor } from './ControlEditor';

const emptyVocabulary = {
  events: {},
  fields: {},
  sla_patterns: {},
  regulations: {},
  roles: [],
  audit_suffixes: [],
};

const sampleVocabulary = {
  events: {
    'member.created': { description: 'Member was created', category: 'member' },
    'payment.submitted': { description: 'Payment submitted', category: 'payment' },
  },
  fields: {
    'member.name': { type: 'string', description: 'Member name', category: 'member', pii: true },
    'payment.amount': { type: 'number', description: 'Payment amount', category: 'payment', pii: false },
  },
  sla_patterns: {},
  regulations: {},
  roles: [],
  audit_suffixes: [],
};

function createControl(overrides = {}) {
  return {
    id: '',
    name: '',
    source_file: '',
    scoped_id: '',
    anchor: '',
    why_reg_cite: '',
    system_behavior: '',
    triggers: [],
    inputs: [],
    outputs: [],
    timers_slas: '',
    edge_cases: '',
    audit_logs: [],
    access_control: '',
    alerts_metrics: '',
    primary_rules: [],
    purpose: '',
    ...overrides,
  };
}

describe('ControlEditor', () => {
  const defaultProps = {
    control: createControl(),
    onChange: vi.fn(),
    onClose: vi.fn(),
    vocabulary: emptyVocabulary,
    onRequestNew: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('header', () => {
    it('displays "New Control" when control.id is empty', () => {
      render(<ControlEditor {...defaultProps} />);
      expect(screen.getByText('New Control')).toBeInTheDocument();
    });

    it('displays control.id when set', () => {
      render(
        <ControlEditor {...defaultProps} control={createControl({ id: 'BA-05' })} />
      );
      expect(screen.getByText('BA-05')).toBeInTheDocument();
    });

    it('displays control name as subtitle', () => {
      render(
        <ControlEditor {...defaultProps} control={createControl({ name: 'OFAC Screening' })} />
      );
      expect(screen.getByText('OFAC Screening')).toBeInTheDocument();
    });

    it('displays "Untitled" when name is empty', () => {
      render(<ControlEditor {...defaultProps} />);
      expect(screen.getByText('Untitled')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows errors when required fields are missing', () => {
      render(<ControlEditor {...defaultProps} />);
      expect(screen.getByText('Control ID is required')).toBeInTheDocument();
      expect(screen.getByText('Control name is required')).toBeInTheDocument();
      expect(screen.getByText('At least one trigger is required')).toBeInTheDocument();
      expect(screen.getByText('Regulatory citation is required')).toBeInTheDocument();
      expect(screen.getByText('System behavior is required')).toBeInTheDocument();
    });

    it('shows error count badge', () => {
      render(<ControlEditor {...defaultProps} />);
      expect(screen.getByText('5 errors')).toBeInTheDocument();
    });

    it('shows "Valid" badge when all required fields are present', () => {
      const validControl = createControl({
        id: 'BA-05',
        name: 'OFAC Screening',
        triggers: ['payment.pre.screen'],
        why_reg_cite: '31 CFR Part 501',
        system_behavior: 'Screen against OFAC list',
      });
      render(<ControlEditor {...defaultProps} control={validControl} />);
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.queryByText(/errors/)).not.toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('shows edit tab by default', () => {
      render(<ControlEditor {...defaultProps} />);
      // Edit tab content should show the Identity section
      expect(screen.getByText('Identity')).toBeInTheDocument();
    });

    it('switches to JSON tab', async () => {
      const user = userEvent.setup();
      const control = createControl({ id: 'TEST-01', name: 'Test' });
      render(<ControlEditor {...defaultProps} control={control} />);

      await user.click(screen.getByRole('button', { name: /json/i }));

      // JSON tab should show the JSON representation
      expect(screen.getByText(/"id":/)).toBeInTheDocument();
      expect(screen.getByText(/Copy JSON/)).toBeInTheDocument();
    });

    it('switches to YAML tab', async () => {
      const user = userEvent.setup();
      const control = createControl({ id: 'TEST-01', name: 'Test' });
      render(<ControlEditor {...defaultProps} control={control} />);

      await user.click(screen.getByRole('button', { name: /yaml/i }));

      expect(screen.getByText(/Copy YAML/)).toBeInTheDocument();
    });
  });

  describe('identity fields', () => {
    it('calls onChange when id is typed', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ControlEditor {...defaultProps} onChange={onChange} />);

      const idInput = screen.getByPlaceholderText('e.g., CA-01');
      await user.type(idInput, 'X');

      // onChange should have been called (value uppercased)
      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.id).toBe('X');
    });

    it('calls onChange when name is typed', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ControlEditor {...defaultProps} onChange={onChange} />);

      const nameInput = screen.getByPlaceholderText('e.g., Governance & Ownership');
      await user.type(nameInput, 'T');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('array operations', () => {
    it('adds a trigger when "Add trigger" is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ControlEditor {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Add trigger'));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.triggers).toEqual(['']);
    });

    it('adds an input when "Add input" is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ControlEditor {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Add input'));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.inputs).toEqual(['']);
    });

    it('adds an output when "Add output" is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ControlEditor {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Add output'));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.outputs).toEqual(['']);
    });

    it('adds an audit log when "Add audit log" is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ControlEditor {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Add audit log'));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.audit_logs).toEqual(['']);
    });

    it('adds a primary rule when "Add rule" is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ControlEditor {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Add rule'));

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.primary_rules).toEqual(['']);
    });
  });

  describe('close button', () => {
    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ControlEditor {...defaultProps} onClose={onClose} />);

      // The X button is the first button in the header
      const closeButtons = screen.getAllByRole('button');
      // Find the close button (it contains the X icon, is the first button)
      await user.click(closeButtons[0]);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('vocabulary integration', () => {
    it('renders vocabulary-aware trigger dropdowns', async () => {
      const user = userEvent.setup();
      const control = createControl({ triggers: [''] });
      render(
        <ControlEditor
          {...defaultProps}
          control={control}
          vocabulary={sampleVocabulary}
        />
      );

      // There should be a dropdown for the trigger
      const triggerDropdown = screen.getByText('Select event...');
      expect(triggerDropdown).toBeInTheDocument();

      // Open it and verify vocabulary events appear
      await user.click(triggerDropdown);
      expect(screen.getByText('member.created')).toBeInTheDocument();
      expect(screen.getByText('payment.submitted')).toBeInTheDocument();
    });

    it('shows PII badge for PII input fields', () => {
      const control = createControl({ inputs: ['member.name'] });
      render(
        <ControlEditor
          {...defaultProps}
          control={control}
          vocabulary={sampleVocabulary}
        />
      );

      expect(screen.getByText('PII')).toBeInTheDocument();
    });
  });
});
