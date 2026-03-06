import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BehaviorEditor } from './BehaviorEditor';

describe('BehaviorEditor', () => {
  it('renders freeform mode by default', () => {
    render(<BehaviorEditor value="" onChange={() => {}} />);
    expect(
      screen.getByPlaceholderText('Describe what the system must do when triggered...')
    ).toBeInTheDocument();
  });

  it('shows textarea with current value in freeform mode', () => {
    render(<BehaviorEditor value="Check OFAC list" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Check OFAC list')).toBeInTheDocument();
  });

  it('calls onChange when typing in freeform mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BehaviorEditor value="" onChange={onChange} />);

    await user.type(
      screen.getByPlaceholderText('Describe what the system must do when triggered...'),
      'A'
    );
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('switches to structured mode', async () => {
    const user = userEvent.setup();
    render(<BehaviorEditor value="" onChange={() => {}} />);

    await user.click(screen.getByText('Steps'));

    // Should show step input instead of textarea
    expect(screen.getByPlaceholderText('Describe this step...')).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Describe what the system must do when triggered...')
    ).not.toBeInTheDocument();
  });

  it('parses existing text into numbered steps', async () => {
    const user = userEvent.setup();
    render(
      <BehaviorEditor value={"1. Fetch member data\n2. Screen against OFAC"} onChange={() => {}} />
    );

    await user.click(screen.getByText('Steps'));

    expect(screen.getByDisplayValue('Fetch member data')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Screen against OFAC')).toBeInTheDocument();
  });

  it('adds a new step in structured mode', async () => {
    const user = userEvent.setup();
    render(<BehaviorEditor value="1. First step" onChange={() => {}} />);

    await user.click(screen.getByText('Steps'));
    await user.click(screen.getByText('Add step'));

    // Should now have 2 step inputs
    const stepInputs = screen.getAllByPlaceholderText('Describe this step...');
    expect(stepInputs).toHaveLength(2);
  });

  it('removes a step in structured mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <BehaviorEditor value={"1. First step\n2. Second step"} onChange={onChange} />
    );

    await user.click(screen.getByText('Steps'));
    const removeButtons = screen.getAllByTitle('Remove step');
    await user.click(removeButtons[0]);

    // Should now have 1 step input with "Second step"
    expect(screen.getByDisplayValue('Second step')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('First step')).not.toBeInTheDocument();
  });

  it('serializes steps back to numbered text on change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BehaviorEditor value="" onChange={onChange} />);

    await user.click(screen.getByText('Steps'));
    await user.type(screen.getByPlaceholderText('Describe this step...'), 'Do something');

    // onChange should have been called with numbered text
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toContain('1. Do something');
  });

  it('switches back to freeform preserving content', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BehaviorEditor value={"1. Step one\n2. Step two"} onChange={onChange} />);

    // Switch to structured
    await user.click(screen.getByText('Steps'));
    expect(screen.getByDisplayValue('Step one')).toBeInTheDocument();

    // Switch back to freeform
    await user.click(screen.getByText('Freeform'));
    expect(
      screen.getByPlaceholderText('Describe what the system must do when triggered...')
    ).toBeInTheDocument();
  });

  it('shows mode toggle buttons', () => {
    render(<BehaviorEditor value="" onChange={() => {}} />);
    expect(screen.getByText('Freeform')).toBeInTheDocument();
    expect(screen.getByText('Steps')).toBeInTheDocument();
  });
});
