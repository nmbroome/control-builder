import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlList } from './ControlList';

const mockControls = [
  {
    id: 'BA-01',
    name: 'CIP Verification',
    source_file: 'bsa-aml.md',
    scoped_id: 'bsa-aml.md:BA-01',
    triggers: ['member.onboarded'],
    inputs: ['member.name'],
    outputs: [],
    audit_logs: [],
    primary_rules: ['31 CFR 1020.220'],
    purpose: 'Verify customer identity',
    why_reg_cite: 'CIP requirement',
    system_behavior: 'Verify identity on onboard',
  },
  {
    id: 'BA-05',
    name: 'OFAC Screening',
    source_file: 'bsa-aml.md',
    scoped_id: 'bsa-aml.md:BA-05',
    triggers: ['payment.pre.screen'],
    inputs: ['party.name', 'party.dob'],
    outputs: ['ofac.blocked'],
    audit_logs: ['ofac.hit.reviewed'],
    primary_rules: ['31 CFR Part 501'],
    purpose: 'Screen against OFAC SDN list',
    why_reg_cite: '31 CFR Part 501',
    system_behavior: 'Screen against OFAC SDN list',
  },
  {
    id: 'FL-01',
    name: 'Protected Bases',
    source_file: 'fair-lending.md',
    scoped_id: 'fair-lending.md:FL-01',
    triggers: ['application.submitted'],
    inputs: [],
    outputs: [],
    audit_logs: [],
    primary_rules: ['ECOA'],
    purpose: 'Fair lending protected bases',
    // Missing why_reg_cite and system_behavior — invalid
  },
];

const defaultProps = {
  controls: mockControls,
  onSelectControl: vi.fn(),
  onDuplicateControl: vi.fn(),
  onDeleteControl: vi.fn(),
};

describe('ControlList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all controls', () => {
    render(<ControlList {...defaultProps} />);
    expect(screen.getByText('BA-01')).toBeInTheDocument();
    expect(screen.getByText('BA-05')).toBeInTheDocument();
    expect(screen.getByText('FL-01')).toBeInTheDocument();
  });

  it('renders source file group headers', () => {
    render(<ControlList {...defaultProps} />);
    expect(screen.getAllByText('bsa-aml.md').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('fair-lending.md').length).toBeGreaterThanOrEqual(1);
  });

  it('shows validation indicators on cards', () => {
    const { container } = render(<ControlList {...defaultProps} />);
    // BA-01 and BA-05 are valid, FL-01 is invalid
    // Check for presence of both check and alert icons
    const checkIcons = container.querySelectorAll('.text-green-500');
    const alertIcons = container.querySelectorAll('.text-amber-500');
    expect(checkIcons.length).toBeGreaterThan(0);
    expect(alertIcons.length).toBeGreaterThan(0);
  });

  it('shows result count', () => {
    render(<ControlList {...defaultProps} />);
    expect(screen.getByText(/showing 3 of 3 controls/i)).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<ControlList {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search controls...')).toBeInTheDocument();
  });

  it('filters controls by search query matching id', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search controls...'), 'BA-05');

    expect(screen.getByText('BA-05')).toBeInTheDocument();
    expect(screen.queryByText('BA-01')).not.toBeInTheDocument();
    expect(screen.queryByText('FL-01')).not.toBeInTheDocument();
    expect(screen.getByText(/showing 1 of 3/i)).toBeInTheDocument();
  });

  it('filters controls by search query matching name', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search controls...'), 'OFAC');

    expect(screen.getByText('BA-05')).toBeInTheDocument();
    expect(screen.queryByText('BA-01')).not.toBeInTheDocument();
  });

  it('filters controls by search query matching purpose', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search controls...'), 'customer identity');

    expect(screen.getByText('BA-01')).toBeInTheDocument();
    expect(screen.queryByText('BA-05')).not.toBeInTheDocument();
  });

  it('filters controls by search query matching trigger', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search controls...'), 'payment.pre');

    expect(screen.getByText('BA-05')).toBeInTheDocument();
    expect(screen.queryByText('FL-01')).not.toBeInTheDocument();
  });

  it('filters by source file pill', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    // Click the bsa-aml.md pill
    const pills = screen.getAllByText('bsa-aml.md');
    // Find the pill button (not the section header)
    const pill = pills.find((el) => el.tagName === 'BUTTON');
    await user.click(pill);

    expect(screen.getByText('BA-01')).toBeInTheDocument();
    expect(screen.getByText('BA-05')).toBeInTheDocument();
    expect(screen.queryByText('FL-01')).not.toBeInTheDocument();
    expect(screen.getByText(/showing 2 of 3/i)).toBeInTheDocument();
  });

  it('filters by validation status - valid only', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    await user.click(screen.getByText(/^Valid/));

    // BA-01 and BA-05 are valid; FL-01 is invalid
    expect(screen.getByText('BA-01')).toBeInTheDocument();
    expect(screen.getByText('BA-05')).toBeInTheDocument();
    expect(screen.queryByText('FL-01')).not.toBeInTheDocument();
  });

  it('filters by validation status - issues only', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    await user.click(screen.getByText(/^Issues/));

    expect(screen.queryByText('BA-01')).not.toBeInTheDocument();
    expect(screen.getByText('FL-01')).toBeInTheDocument();
  });

  it('calls onSelectControl when card is clicked', async () => {
    const user = userEvent.setup();
    const onSelectControl = vi.fn();
    render(<ControlList {...defaultProps} onSelectControl={onSelectControl} />);

    await user.click(screen.getByText('OFAC Screening'));

    expect(onSelectControl).toHaveBeenCalledWith(mockControls[1]);
  });

  it('calls onDuplicateControl when duplicate button is clicked', async () => {
    const user = userEvent.setup();
    const onDuplicateControl = vi.fn();
    render(<ControlList {...defaultProps} onDuplicateControl={onDuplicateControl} />);

    const duplicateButtons = screen.getAllByTitle('Duplicate');
    await user.click(duplicateButtons[0]);

    expect(onDuplicateControl).toHaveBeenCalledWith(mockControls[0]);
  });

  it('calls onDeleteControl when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDeleteControl = vi.fn();
    render(<ControlList {...defaultProps} onDeleteControl={onDeleteControl} />);

    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    expect(onDeleteControl).toHaveBeenCalledWith(mockControls[0]);
  });

  it('toggles to table view', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    await user.click(screen.getByTitle('Table view'));

    // Table should show column headers (Source has sort indicator appended)
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText(/^Source/)).toBeInTheDocument();
  });

  it('shows "no results" when search matches nothing', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search controls...'), 'xyznonexistent');

    expect(screen.getByText(/no controls match/i)).toBeInTheDocument();
  });

  it('shows empty state when controls array is empty', () => {
    render(<ControlList {...defaultProps} controls={[]} />);
    expect(screen.getByText(/no controls yet/i)).toBeInTheDocument();
  });

  it('clears source filter when "Clear filter" is clicked', async () => {
    const user = userEvent.setup();
    render(<ControlList {...defaultProps} />);

    // Apply filter
    const pills = screen.getAllByText('bsa-aml.md');
    const pill = pills.find((el) => el.tagName === 'BUTTON');
    await user.click(pill);
    expect(screen.getByText(/showing 2 of 3/i)).toBeInTheDocument();

    // Clear filter
    await user.click(screen.getByText('Clear filter'));
    expect(screen.getByText(/showing 3 of 3/i)).toBeInTheDocument();
  });
});
