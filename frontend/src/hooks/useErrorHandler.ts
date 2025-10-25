import { useState, useCallback } from 'react';
import { ApiError } from '../types';

export interface ErrorState {
  error: string | null;
  isError: boolean;
  errorCode?: string | undefined;
}

export interface UseErrorHandlerResult extends ErrorState {
  setError: (error: string | Error | ApiError | null) => void;
  clearError: () => void;
  handleAsyncError: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
}

export function useErrorHandler(): UseErrorHandlerResult {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorCode: undefined,
  });

  const setError = useCallback((error: string | Error | ApiError | null) => {
    if (!error) {
      setErrorState({
        error: null,
        isError: false,
        errorCode: undefined,
      });
      return;
    }

    if (typeof error === 'string') {
      setErrorState({
        error,
        isError: true,
        errorCode: undefined,
      });
    } else if (error instanceof Error) {
      setErrorState({
        error: error.message,
        isError: true,
        errorCode: undefined,
      });
    } else if (isApiError(error)) {
      setErrorState({
        error: error.message,
        isError: true,
        errorCode: error.code,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorCode: undefined,
    });
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      clearError();
      return await asyncFn();
    } catch (error) {
      setError(error as Error);
      return null;
    }
  }, [setError, clearError]);

  return {
    ...errorState,
    setError,
    clearError,
    handleAsyncError,
  };
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'message' in error
  );
}