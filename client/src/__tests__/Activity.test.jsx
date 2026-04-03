import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import Activity from '../pages/Activity';
import api from '../api';

describe('Activity page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows empty state', async () => {
    api.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Activity />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No activity yet.')).toBeInTheDocument();
    });
  });

  test('shows activity items', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          type: 'expense',
          id: 1,
          title: 'Dinner',
          amount: '50.00',
          created_at: '2024-01-01T00:00:00Z',
          user_name: 'Alice',
          avatar_url: null,
          group_name: 'Roommates',
          group_id: 1,
        },
        {
          type: 'settlement',
          id: 1,
          title: 'Settlement',
          amount: '25.00',
          created_at: '2024-01-02T00:00:00Z',
          user_name: 'Bob',
          avatar_url: null,
          group_name: null,
          group_id: null,
        },
      ],
    });

    render(
      <MemoryRouter>
        <Activity />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
      expect(screen.getByText(/added "Dinner"/)).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('in Roommates')).toBeInTheDocument();
    });
  });
});
