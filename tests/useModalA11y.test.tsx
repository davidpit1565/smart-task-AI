import { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useModalA11y } from '@/ui/hooks/useModalA11y';

function TestModal({ onClose }: { onClose(): void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y(containerRef, onClose);
  return (
    <div ref={containerRef} role="dialog">
      <button type="button">First</button>
      <button type="button">Second</button>
      <button type="button">Last</button>
    </div>
  );
}

describe('useModalA11y', () => {
  it('focuses the first focusable element on mount', () => {
    render(<TestModal onClose={vi.fn()} />);
    expect(screen.getByText('First')).toHaveFocus();
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wraps Tab from the last item back to the first', () => {
    render(<TestModal onClose={vi.fn()} />);
    screen.getByText('Last').focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByText('First')).toHaveFocus();
  });

  it('wraps Shift+Tab from the first item back to the last', () => {
    render(<TestModal onClose={vi.fn()} />);
    screen.getByText('First').focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByText('Last')).toHaveFocus();
  });

  it('restores focus to the previously focused element on unmount', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(<TestModal onClose={vi.fn()} />);
    expect(screen.getByText('First')).toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
