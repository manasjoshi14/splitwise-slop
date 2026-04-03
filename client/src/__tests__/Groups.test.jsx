import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

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

import Groups from '../pages/Groups';
import api from '../api';

describe('Groups page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows groups list', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Roommates',
          member_count: '3',
          created_at: '2024-01-01',
        },
      ],
    });

    render(
      <MemoryRouter>
        <Groups />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Roommates')).toBeInTheDocument();
      expect(screen.getByText('3 members')).toBeInTheDocument();
    });
  });

  test('shows empty state when no groups', async () => {
    api.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Groups />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('No groups yet. Create one to get started!')
      ).toBeInTheDocument();
    });
  });

  test('shows create group form when button clicked', async () => {
    api.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Groups />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Create group')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Create group'));
    expect(screen.getByPlaceholderText('Group name')).toBeInTheDocument();
  });
});
