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

import GroupDetail from '../pages/GroupDetail';
import api from '../api';

describe('GroupDetail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows group info and expenses', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/groups/1') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Roommates',
            members: [
              {
                id: 1,
                name: 'Alice',
                email: 'alice@test.com',
                avatar_url: null,
              },
              { id: 2, name: 'Bob', email: 'bob@test.com', avatar_url: null },
            ],
          },
        });
      }
      if (url === '/api/expenses/group/1') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              description: 'Rent',
              amount: '1000.00',
              paid_by_name: 'Alice',
              created_at: '2024-01-01T00:00:00Z',
              splits: [],
            },
          ],
        });
      }
      if (url === '/api/balances/group/1') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter initialEntries={['/groups/1']}>
        <Routes>
          <Route path="/groups/:id" element={<GroupDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Roommates')).toBeInTheDocument();
      expect(screen.getByText('2 members')).toBeInTheDocument();
      expect(screen.getByText('Rent')).toBeInTheDocument();
    });
  });
});
