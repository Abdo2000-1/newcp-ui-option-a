import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useThemeContext } from '../ThemeContext';

function TestConsumer() {
  const { isDark, theme, toggleTheme, setTheme, isTransitioning, prefersReducedMotion } = useThemeContext();

  return (
    <div>
      <span data-testid="theme-name">{theme}</span>
      <span data-testid="is-dark">{isDark ? 'dark' : 'light'}</span>
      <span data-testid="is-transitioning">{isTransitioning ? 'true' : 'false'}</span>
      <span data-testid="reduced-motion">{prefersReducedMotion ? 'true' : 'false'}</span>
      <button onClick={toggleTheme} aria-label="Toggle Clinical Theme">
        Toggle Theme
      </button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('red')}>Set Red</button>
    </div>
  );
}

describe('Smooth Accessible Theme Transition (UIUX-REQ-010)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'theme-red', 'theme-transitioning');
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('toggles smoothly between light and dark modes with transient transition state', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /toggle clinical theme/i });
    expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');

    // Initial state is dark by default in 3DDX New CP
    expect(screen.getByTestId('is-dark')).toHaveTextContent('dark');

    // Click toggle to switch to light
    fireEvent.click(toggleBtn);

    // Immediate transition state is activated
    expect(screen.getByTestId('is-transitioning')).toHaveTextContent('true');
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true);

    // Fast-forward past transition window (220ms)
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);
    expect(screen.getByTestId('is-dark')).toHaveTextContent('light');
    expect(localStorage.getItem('dentalab-theme-mode')).toBe('light');
  });

  it('supports direct theme selection and persists mode across re-renders', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    const setRedBtn = screen.getByRole('button', { name: /set red/i });
    fireEvent.click(setRedBtn);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByTestId('theme-name')).toHaveTextContent('red');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('dark');
    expect(localStorage.getItem('dentalab-theme-mode')).toBe('red');

    const setLightBtn = screen.getByRole('button', { name: /set light/i });
    fireEvent.click(setLightBtn);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('light');
  });

  it('handles rapid repeated toggling safely without locking or throwing errors', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /toggle clinical theme/i });

    // Rapid successive toggles
    fireEvent.click(toggleBtn);
    fireEvent.click(toggleBtn);
    fireEvent.click(toggleBtn);
    fireEvent.click(toggleBtn);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);
  });

  it('respects prefers-reduced-motion by bypassing transition delays', () => {
    // Mock matchMedia for prefers-reduced-motion: reduce
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => {
      return {
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');

    const toggleBtn = screen.getByRole('button', { name: /toggle clinical theme/i });
    fireEvent.click(toggleBtn);

    // Under reduced motion, transition class and delay should be bypassed
    expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);

    window.matchMedia = originalMatchMedia;
  });
});
