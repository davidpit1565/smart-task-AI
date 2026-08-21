import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AiHeroCard } from '@/ui/components/AiHeroCard';
import { LanguageProvider } from '@/i18n/LanguageContext';

function renderCard() {
  return render(
    <LanguageProvider>
      <AiHeroCard />
    </LanguageProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('AiHeroCard', () => {
  it('renders the explainer by default', () => {
    renderCard();
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('dismisses and stays dismissed after a re-render', () => {
    const { unmount } = renderCard();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();

    unmount();
    renderCard();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
