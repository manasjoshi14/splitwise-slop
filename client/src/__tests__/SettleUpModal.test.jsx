import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

import SettleUpModal from '../components/SettleUpModal';
import api from '../api';

describe('SettleUpModal', () => {
  const defaultProps = {
    balance: { user_id: 2, name: 'Bob', balance: '-50.00' },
    groupId: 1,
    onClose: vi.fn(),
    onSettled: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders settlement form', () => {
    render(
      <MemoryRouter>
        <SettleUpModal {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText('Settle Up with Bob')).toBeInTheDocument();
    expect(screen.getByText(/You owe Bob \$50\.00/)).toBeInTheDocument();
    expect(screen.getByText('Record Payment')).toBeInTheDocument();
  });

  test('pre-fills amount with balance', () => {
    render(
      <MemoryRouter>
        <SettleUpModal {...defaultProps} />
      </MemoryRouter>
    );

    const input = screen.getByDisplayValue('50.00');
    expect(input).toBeInTheDocument();
  });

  test('submits settlement', async () => {
    api.post.mockResolvedValue({ data: {} });

    render(
      <MemoryRouter>
        <SettleUpModal {...defaultProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Record Payment'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/settlements', {
        paid_to: 2,
        amount: 50,
        group_id: 1,
      });
    });
  });

  test('calls onClose when X is clicked', () => {
    render(
      <MemoryRouter>
        <SettleUpModal {...defaultProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('\u00D7'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
