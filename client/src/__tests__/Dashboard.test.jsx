import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Alice Test', avatar_url: null },
  }),
}));

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import Dashboard from '../pages/Dashboard';
import api from '../api';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows loading state initially', () => {
    api.get.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows balances after loading', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          user_id: 2,
          name: 'Bob',
          email: 'bob@test.com',
          avatar_url: null,
          balance: '-25.00',
        },
      ],
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hi, Alice')).toBeInTheDocument();
    });
    expect(screen.getByText(/you owe \$25\.00/)).toBeInTheDocument();
  });

  test('shows empty state when no balances', async () => {
    api.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('No balances yet. Add an expense to get started!')
      ).toBeInTheDocument();
    });
  });

  test('shows summary cards with totals', async () => {
    api.get.mockResolvedValue({
      data: [
        { user_id: 2, name: 'Bob', avatar_url: null, balance: '50.00' },
        { user_id: 3, name: 'Charlie', avatar_url: null, balance: '-30.00' },
      ],
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('$30.00')).toBeInTheDocument();
    });
  });
});
