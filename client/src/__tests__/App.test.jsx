import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockRejectedValue(new Error('No token')),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import App from '../App';

describe('App', () => {
  test('renders login page when not authenticated', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('SplitSlop')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });
  });
});
