import { getErrorMessage } from '../../services/apiClient';

describe('apiClient Helper Functions', () => {
  it('extracts error message from standard API error object', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          message: 'Invalid credentials provided',
        },
      },
    };

    expect(getErrorMessage(error)).toBe('Invalid credentials provided');
  });

  it('extracts joined field errors from API error response', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          errors: ['Email is invalid', 'Password is too short'],
        },
      },
    };

    expect(getErrorMessage(error)).toBe('Email is invalid, Password is too short');
  });

  it('falls back to generic error message for unknown errors', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
  });
});
