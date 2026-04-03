import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockUser = { id: 1, name: 'Alice', avatar_url: null };

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
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

import AddExpenseModal from '../components/AddExpenseModal';

describe('AddExpenseModal', () => {
  const members = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];

  let defaultProps;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps = {
      groupId: 1,
      members,
      onClose: vi.fn(),
      onAdded: vi.fn(),
    };
  });

  test('renders form fields', () => {
    render(
      <MemoryRouter>
        <AddExpenseModal {...defaultProps} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: 'Add Expense' })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Description (e.g. Dinner)')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Equal')).toBeInTheDocument();
    expect(screen.getByText('Exact amounts')).toBeInTheDocument();
  });

  test('shows split type buttons', () => {
    render(
      <MemoryRouter>
        <AddExpenseModal {...defaultProps} />
      </MemoryRouter>
    );

    const exactBtn = screen.getByText('Exact amounts');
    fireEvent.click(exactBtn);
    expect(exactBtn.className).toContain('bg-teal-600');
  });

  test('shows per-person cost for equal split', () => {
    render(
      <MemoryRouter>
        <AddExpenseModal {...defaultProps} />
      </MemoryRouter>
    );

    const amountInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(amountInput, { target: { value: '100' } });

    expect(screen.getByText(/\$50\.00 per/)).toBeInTheDocument();
  });

  test('calls onClose when X is clicked', () => {
    render(
      <MemoryRouter>
        <AddExpenseModal {...defaultProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('\u00D7'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
