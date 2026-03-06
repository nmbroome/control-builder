import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Section } from './Section';

describe('Section', () => {
  it('renders title text', () => {
    render(<Section title="My Section">Content</Section>);
    expect(screen.getByText('My Section')).toBeInTheDocument();
  });

  it('shows children when defaultOpen is true (default)', () => {
    render(<Section title="Open">Visible content</Section>);
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('hides children when defaultOpen is false', () => {
    render(<Section title="Closed" defaultOpen={false}>Hidden content</Section>);
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('toggles children visibility on header click', async () => {
    const user = userEvent.setup();
    render(<Section title="Toggle">Toggle content</Section>);

    // Initially visible
    expect(screen.getByText('Toggle content')).toBeInTheDocument();

    // Click to close
    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('Toggle content')).not.toBeInTheDocument();

    // Click to reopen
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Toggle content')).toBeInTheDocument();
  });

  it('renders badge when provided', () => {
    render(
      <Section title="With Badge" badge={<span data-testid="badge">3</span>}>
        Content
      </Section>
    );
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
