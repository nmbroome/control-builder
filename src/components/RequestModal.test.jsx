import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestModal } from './RequestModal';

describe('RequestModal', () => {
  const defaultProps = {
    type: 'event',
    controlId: 'BA-05',
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correct title for event type', () => {
    render(<RequestModal {...defaultProps} type="event" />);
    expect(screen.getByText('Request New Event')).toBeInTheDocument();
  });

  it('renders correct title for field type', () => {
    render(<RequestModal {...defaultProps} type="field" />);
    expect(screen.getByText('Request New Field')).toBeInTheDocument();
  });

  it('renders correct label for event name input', () => {
    render(<RequestModal {...defaultProps} type="event" />);
    expect(screen.getByText('Event Name')).toBeInTheDocument();
  });

  it('renders correct label for field name input', () => {
    render(<RequestModal {...defaultProps} type="field" />);
    expect(screen.getByText('Field Name')).toBeInTheDocument();
  });

  it('submit button is disabled when name and requirement are empty', () => {
    render(<RequestModal {...defaultProps} />);
    const submitBtn = screen.getByRole('button', { name: /submit request/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submit button is enabled when name and requirement are filled', async () => {
    const user = userEvent.setup();
    render(<RequestModal {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/e\.g\./), 'payment.processed');
    await user.type(screen.getByPlaceholderText(/cite the regulation/i), 'Required by BSA');

    const submitBtn = screen.getByRole('button', { name: /submit request/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onSubmit with correct payload shape', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RequestModal {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText(/e\.g\./), 'payment.processed');
    await user.type(screen.getByPlaceholderText(/what this represents/i), 'A payment event');
    await user.type(screen.getByPlaceholderText(/cite the regulation/i), 'Required by BSA');

    await user.click(screen.getByRole('button', { name: /submit request/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];

    expect(payload.type).toBe('event');
    expect(payload.controlContext).toBe('BA-05');
    expect(payload.name).toBe('payment.processed');
    expect(payload.description).toBe('A payment event');
    expect(payload.requirement).toBe('Required by BSA');
    expect(payload.priority).toBe('medium'); // default
    expect(payload.status).toBe('submitted');
    expect(payload.requestId).toMatch(/^VR-2026-\d{3}$/);
    expect(payload.submittedAt).toBeDefined();
  });

  it('calls onClose after submit', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RequestModal {...defaultProps} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText(/e\.g\./), 'test.event');
    await user.type(screen.getByPlaceholderText(/cite the regulation/i), 'Reason');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RequestModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('allows changing priority', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RequestModal {...defaultProps} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByRole('combobox'), 'critical');
    await user.type(screen.getByPlaceholderText(/e\.g\./), 'urgent.event');
    await user.type(screen.getByPlaceholderText(/cite the regulation/i), 'Deadline');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    expect(onSubmit.mock.calls[0][0].priority).toBe('critical');
  });
});
