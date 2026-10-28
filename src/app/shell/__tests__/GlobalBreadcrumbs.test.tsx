import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GlobalBreadcrumbs } from '../GlobalBreadcrumbs';

describe('GlobalBreadcrumbs (Accessible MUI Breadcrumbs Best Practice)', () => {
  it('does not render breadcrumbs on login or empty root', () => {
    const { container: loginContainer } = render(
      <MemoryRouter initialEntries={['/login']}>
        <GlobalBreadcrumbs />
      </MemoryRouter>
    );
    expect(loginContainer.firstChild).toBeNull();

    const { container: rootContainer } = render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalBreadcrumbs />
      </MemoryRouter>
    );
    expect(rootContainer.firstChild).toBeNull();
  });

  it('renders Home breadcrumb as active current page when on /home', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <GlobalBreadcrumbs />
      </MemoryRouter>
    );

    const nav = screen.getByTestId('global-breadcrumbs');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');

    const homeItem = screen.getByText('Home');
    expect(homeItem).toBeInTheDocument();
    expect(homeItem.closest('[aria-current="page"]')).toBeInTheDocument();
  });

  it('renders route hierarchy and semantic navigation attributes for approved feature routes', () => {
    render(
      <MemoryRouter initialEntries={['/flow']}>
        <GlobalBreadcrumbs />
      </MemoryRouter>
    );

    const nav = screen.getByTestId('global-breadcrumbs');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');

    expect(screen.getByRole('link', { name: /Navigate to Home/i })).toBeInTheDocument();
    const current = screen.getByText('Active Cases');
    expect(current).toBeInTheDocument();
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('formats nested identifiers and dynamic segments safely', () => {
    render(
      <MemoryRouter initialEntries={['/orders/504901']}>
        <GlobalBreadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Navigate to Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Orders Queue' })).toBeInTheDocument();

    const idSegment = screen.getByText('ID #504901');
    expect(idSegment).toBeInTheDocument();
    expect(idSegment).toHaveAttribute('aria-current', 'page');
  });

  it('formats unknown kebab-case routes cleanly without exposing raw technical tokens', () => {
    render(
      <MemoryRouter initialEntries={['/custom-clinical-protocol']}>
        <GlobalBreadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Clinical Protocol')).toBeInTheDocument();
  });
});
