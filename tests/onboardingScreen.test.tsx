import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingScreen } from '@/ui/screens/OnboardingScreen';
import { LanguageProvider } from '@/i18n/LanguageContext';

function renderScreen(onFinish = vi.fn()) {
  render(
    <LanguageProvider>
      <OnboardingScreen onFinish={onFinish} />
    </LanguageProvider>,
  );
  return onFinish;
}

describe('OnboardingScreen', () => {
  it('shows the app name on the first page', () => {
    renderScreen();
    expect(screen.getByText('Unknot')).toBeInTheDocument();
  });

  it('advances to the second page on Next, then calls onFinish on Get started', () => {
    const onFinish = renderScreen();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Break a stuck task into small steps')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Get started'));
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it('calls onFinish immediately when Skip is clicked on the first page', () => {
    const onFinish = renderScreen();
    fireEvent.click(screen.getByText('Skip'));
    expect(onFinish).toHaveBeenCalledOnce();
  });
});
