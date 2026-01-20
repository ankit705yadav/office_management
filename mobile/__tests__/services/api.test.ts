import { handleApiError } from '../../services/api';
import axios from 'axios';

describe('API Utilities', () => {
  describe('handleApiError', () => {
    it('should handle axios error with message', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };

      // Mock axios.isAxiosError
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = handleApiError(error);
      expect(message).toBe('Invalid credentials');
    });

    it('should handle axios error with errors array', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            errors: [
              { message: 'Email is required' },
              { message: 'Password is required' },
            ],
          },
        },
      };

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = handleApiError(error);
      expect(message).toBe('Email is required, Password is required');
    });

    it('should handle axios error with only axiosError.message', () => {
      const error = {
        isAxiosError: true,
        message: 'Network Error',
        response: {
          data: {},
        },
      };

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = handleApiError(error);
      expect(message).toBe('Network Error');
    });

    it('should handle standard Error', () => {
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const error = new Error('Something went wrong');
      const message = handleApiError(error);
      expect(message).toBe('Something went wrong');
    });

    it('should handle unknown error', () => {
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const message = handleApiError('unknown');
      expect(message).toBe('An unknown error occurred');
    });

    it('should handle null error', () => {
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const message = handleApiError(null);
      expect(message).toBe('An unknown error occurred');
    });
  });
});
