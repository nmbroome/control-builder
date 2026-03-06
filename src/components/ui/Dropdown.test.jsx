import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from './Dropdown';

const flatOptions = [
  { id: 'option-a', description: 'First option' },
  { id: 'option-b', description: 'Second option' },
  { id: 'option-c', description: 'Third option' },
];

const groupedOptions = {
  member: [
    { id: 'member.created', description: 'Member was created' },
    { id: 'member.updated', description: 'Member was updated' },
  ],
  payment: [
    { id: 'payment.submitted', description: 'Payment submitted' },
  ],
};

describe('Dropdown', () => {
  it('renders placeholder when no value is selected', () => {
    render(
      <Dropdown value="" onChange={() => {}} options={flatOptions} placeholder="Pick one..." />
    );
    expect(screen.getByText('Pick one...')).toBeInTheDocument();
  });

  it('renders selected value when value prop is set', () => {
    render(
      <Dropdown value="option-b" onChange={() => {}} options={flatOptions} placeholder="Pick one..." />
    );
    expect(screen.getByText('option-b')).toBeInTheDocument();
  });

  it('opens dropdown panel on button click', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown value="" onChange={() => {}} options={flatOptions} placeholder="Pick one..." />
    );

    // Panel not visible initially
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();

    // Click to open
    await user.click(screen.getByRole('button', { name: /pick one/i }));
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('shows search input when open', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown value="" onChange={() => {}} options={flatOptions} placeholder="Pick one..." />
    );

    await user.click(screen.getByRole('button', { name: /pick one/i }));
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('filters options by search term matching id', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown value="" onChange={() => {}} options={flatOptions} placeholder="Pick one..." />
    );

    await user.click(screen.getByRole('button', { name: /pick one/i }));
    await user.type(screen.getByPlaceholderText('Search...'), 'option-a');

    // option-a should be visible, others should not
    expect(screen.getByText('option-a')).toBeInTheDocument();
    expect(screen.queryByText('option-b')).not.toBeInTheDocument();
    expect(screen.queryByText('option-c')).not.toBeInTheDocument();
  });

  it('selects an option and calls onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Dropdown value="" onChange={onChange} options={flatOptions} placeholder="Pick one..." />
    );

    await user.click(screen.getByRole('button', { name: /pick one/i }));
    await user.click(screen.getByText('option-b'));

    expect(onChange).toHaveBeenCalledWith('option-b');
  });

  it('closes dropdown after selection', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown value="" onChange={() => {}} options={flatOptions} placeholder="Pick one..." />
    );

    await user.click(screen.getByRole('button', { name: /pick one/i }));
    await user.click(screen.getByText('option-a'));

    // Search input should be gone (panel closed)
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  it('shows "Request new..." button when onRequestNew is provided', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown
        value=""
        onChange={() => {}}
        options={flatOptions}
        placeholder="Pick one..."
        onRequestNew={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /pick one/i }));
    expect(screen.getByText(/request new/i)).toBeInTheDocument();
  });

  it('does not show "Request new..." button when onRequestNew is not provided', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown value="" onChange={() => {}} options={flatOptions} placeholder="Pick one..." />
    );

    await user.click(screen.getByRole('button', { name: /pick one/i }));
    expect(screen.queryByText(/request new/i)).not.toBeInTheDocument();
  });

  it('calls onRequestNew and closes dropdown when "Request new..." is clicked', async () => {
    const user = userEvent.setup();
    const onRequestNew = vi.fn();
    render(
      <Dropdown
        value=""
        onChange={() => {}}
        options={flatOptions}
        placeholder="Pick one..."
        onRequestNew={onRequestNew}
      />
    );

    await user.click(screen.getByRole('button', { name: /pick one/i }));
    await user.click(screen.getByText(/request new/i));

    expect(onRequestNew).toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  describe('grouped mode', () => {
    it('renders category headers', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown
          value=""
          onChange={() => {}}
          options={groupedOptions}
          grouped={true}
          placeholder="Select event..."
        />
      );

      await user.click(screen.getByRole('button', { name: /select event/i }));
      expect(screen.getByText('member')).toBeInTheDocument();
      expect(screen.getByText('payment')).toBeInTheDocument();
    });

    it('filters grouped options by search term', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown
          value=""
          onChange={() => {}}
          options={groupedOptions}
          grouped={true}
          placeholder="Select event..."
        />
      );

      await user.click(screen.getByRole('button', { name: /select event/i }));
      await user.type(screen.getByPlaceholderText('Search...'), 'payment');

      // payment group should be visible
      expect(screen.getByText('payment.submitted')).toBeInTheDocument();
      // member group should be filtered out
      expect(screen.queryByText('member.created')).not.toBeInTheDocument();
    });

    it('filters grouped options by description', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown
          value=""
          onChange={() => {}}
          options={groupedOptions}
          grouped={true}
          placeholder="Select event..."
        />
      );

      await user.click(screen.getByRole('button', { name: /select event/i }));
      await user.type(screen.getByPlaceholderText('Search...'), 'submitted');

      expect(screen.getByText('payment.submitted')).toBeInTheDocument();
      expect(screen.queryByText('member.created')).not.toBeInTheDocument();
    });

    it('selects a grouped option and calls onChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Dropdown
          value=""
          onChange={onChange}
          options={groupedOptions}
          grouped={true}
          placeholder="Select event..."
        />
      );

      await user.click(screen.getByRole('button', { name: /select event/i }));
      await user.click(screen.getByText('member.created'));

      expect(onChange).toHaveBeenCalledWith('member.created');
    });

    it('shows selected value label for grouped option', () => {
      render(
        <Dropdown
          value="payment.submitted"
          onChange={() => {}}
          options={groupedOptions}
          grouped={true}
          placeholder="Select event..."
        />
      );
      expect(screen.getByText('payment.submitted')).toBeInTheDocument();
    });
  });

  describe('string options', () => {
    const stringOptions = ['alpha', 'beta', 'gamma'];

    it('renders string options', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown value="" onChange={() => {}} options={stringOptions} placeholder="Pick..." />
      );

      await user.click(screen.getByRole('button', { name: /pick/i }));
      expect(screen.getByText('alpha')).toBeInTheDocument();
      expect(screen.getByText('beta')).toBeInTheDocument();
    });

    it('selects a string option', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Dropdown value="" onChange={onChange} options={stringOptions} placeholder="Pick..." />
      );

      await user.click(screen.getByRole('button', { name: /pick/i }));
      await user.click(screen.getByText('gamma'));

      expect(onChange).toHaveBeenCalledWith('gamma');
    });
  });
});
