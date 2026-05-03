/**
 * useApi.js — Generic React hooks for API call lifecycle management.
 *
 * Provides useApi (single call) and usePaginatedApi (paged list) hooks that
 * wrap any API function with loading, error, and data state so components
 * don't need to manage this boilerplate themselves.
 */
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiFunc - The API function to call
 * @param {Object} options - Options for the hook
 * @returns {Object} - { data, loading, error, execute }
 */
export function useApi(apiFunc, options = {}) {
  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Success!',
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFunc(...args);
        setData(response.data);

        if (showSuccessToast) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess(response.data);
        }

        return { success: true, data: response.data };
      } catch (err) {
        const errorMessage =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'An error occurred';

        setError(errorMessage);

        if (showErrorToast) {
          toast.error(errorMessage);
        }

        if (onError) {
          onError(err);
        }

        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, onSuccess, onError, showSuccessToast, showErrorToast, successMessage]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * Custom hook for paginated API calls
 * @param {Function} apiFunc - The API function to call
 * @param {Object} options - Options for the hook
 * @returns {Object} - { data, loading, error, page, totalPages, nextPage, prevPage, goToPage, refresh }
 */
export function usePaginatedApi(apiFunc, options = {}) {
  const { pageSize = 10, initialPage = 1 } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(
    async (pageNum = page, params = {}) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFunc({
          page: pageNum,
          page_size: pageSize,
          ...params,
        });

        setData(response.data.results || response.data);
        setTotalCount(response.data.count || response.data.length);
        setTotalPages(Math.ceil((response.data.count || response.data.length) / pageSize));

        return { success: true, data: response.data };
      } catch (err) {
        const errorMessage =
          err.response?.data?.detail || err.response?.data?.message || 'An error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, page, pageSize]
  );

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      const newPage = page + 1;
      setPage(newPage);
      fetchData(newPage);
    }
  }, [page, totalPages, fetchData]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      fetchData(newPage);
    }
  }, [page, fetchData]);

  const goToPage = useCallback(
    (pageNum) => {
      if (pageNum >= 1 && pageNum <= totalPages) {
        setPage(pageNum);
        fetchData(pageNum);
      }
    },
    [totalPages, fetchData]
  );

  const refresh = useCallback(() => {
    fetchData(page);
  }, [page, fetchData]);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    fetchData,
  };
}

export default useApi;
