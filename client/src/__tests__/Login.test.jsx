import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

describe('Login page', () => {
  test('renders the app name', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText('SplitSlop')).toBeInTheDocument();
  });

  test('renders Google sign-in link', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const link = screen.getByText('Sign in with Google');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/auth/google');
  });

  test('renders tagline', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(
      screen.getByText('Split expenses with friends, the easy way.')
    ).toBeInTheDocument();
  });
});
