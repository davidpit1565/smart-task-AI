import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeTileGrid } from '@/ui/components/HomeTileGrid';
import { LanguageProvider } from '@/i18n/LanguageContext';

function renderGrid(props: Parameters<typeof HomeTileGrid>[0]) {
  return render(
    <LanguageProvider>
      <HomeTileGrid {...props} />
    </LanguageProvider>,
  );
}

describe('HomeTileGrid', () => {
  it('renders the counts passed in for Today/Overdue/Inbox', () => {
    renderGrid({ todayCount: 3, overdueCount: 1, inboxCount: 5, onNavigate: vi.fn() });
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not render a count for tiles with no natural count (Calendar/Projects/More)', () => {
    renderGrid({ todayCount: 0, overdueCount: 0, inboxCount: 0, onNavigate: vi.fn() });
    // Calendar/Projects/More tiles should show a label but no numeric count element of their own beyond the three zeros above.
    expect(screen.getAllByText('0')).toHaveLength(3);
  });

  it('navigates to the right screen when a tile is clicked', () => {
    const onNavigate = vi.fn();
    renderGrid({ todayCount: 0, overdueCount: 0, inboxCount: 0, onNavigate });
    fireEvent.click(screen.getByText('Projects'));
    expect(onNavigate).toHaveBeenCalledWith('projects');
  });

  it('routes the Overdue tile back to the Today screen', () => {
    const onNavigate = vi.fn();
    renderGrid({ todayCount: 0, overdueCount: 2, inboxCount: 0, onNavigate });
    fireEvent.click(screen.getByText('Overdue'));
    expect(onNavigate).toHaveBeenCalledWith('today');
  });
});
