import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../SummaryCard';

describe('SummaryCard', () => {
  it('renders title and value', () => {
    render(<SummaryCard title="Total Expenses" value="$1,234.56" />);
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<SummaryCard title="Number of Expenses" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<SummaryCard title="Test" value="v" icon="payments" />);
    expect(screen.getByText('payments')).toBeInTheDocument();
  });

  it('renders skeleton loading state', () => {
    const { container } = render(<SummaryCard title="" value="" loading />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not render skeleton when not loading', () => {
    const { container } = render(<SummaryCard title="Title" value="Value" />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBe(0);
  });
});
