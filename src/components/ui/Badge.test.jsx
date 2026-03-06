import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies default variant when none specified', () => {
    const { container } = render(<Badge>Default</Badge>);
    const span = container.querySelector('span');
    expect(span.className).toContain('bg-gray-100');
    expect(span.className).toContain('text-gray-700');
  });

  it.each([
    ['success', 'bg-green-100', 'text-green-700'],
    ['warning', 'bg-amber-100', 'text-amber-700'],
    ['error', 'bg-red-100', 'text-red-700'],
    ['info', 'bg-blue-100', 'text-blue-700'],
    ['pii', 'bg-purple-100', 'text-purple-700'],
  ])('applies %s variant classes', (variant, bgClass, textClass) => {
    const { container } = render(<Badge variant={variant}>Test</Badge>);
    const span = container.querySelector('span');
    expect(span.className).toContain(bgClass);
    expect(span.className).toContain(textClass);
  });
});
