import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Alice', avatar_url: null },
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

import FriendDetail from '../pages/FriendDetail';
import api from '../api';

describe('FriendDetail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows friend expenses and balance', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/api/expenses/between/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              description: 'Coffee',
              amount: '10.00',
              paid_by_name: 'Alice',
              created_at: '2024-01-01T00:00:00Z',
              splits: [],
            },
          ],
        });
      }
      if (url === '/api/balances') {
        return Promise.resolve({
          data: [
            {
              user_id: 2,
              name: 'Bob',
              email: 'bob@test.com',
              avatar_url: null,
              balance: '-5.00',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter initialEntries={['/friends/2']}>
        <Routes>
          <Route path="/friends/:id" element={<FriendDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  test('shows empty expenses state', async () => {
    api.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter initialEntries={['/friends/2']}>
        <Routes>
          <Route path="/friends/:id" element={<FriendDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No expenses yet.')).toBeInTheDocument();
    });
  });
});
