import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Alice', avatar_url: null },
  }),
}));

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import Friends from '../pages/Friends';
import api from '../api';

describe('Friends page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows friends list with balances', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/friends') {
        return Promise.resolve({
          data: [
            { id: 2, name: 'Bob', email: 'bob@test.com', avatar_url: null },
          ],
        });
      }
      if (url === '/api/balances') {
        return Promise.resolve({
          data: [
            { user_id: 2, name: 'Bob', balance: '-25.00', avatar_url: null },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <Friends />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText(/you owe \$25\.00/)).toBeInTheDocument();
    });
  });

  test('shows empty state', async () => {
    api.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Friends />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No friends yet/)).toBeInTheDocument();
    });
  });
});
