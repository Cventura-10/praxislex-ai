import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/**
 * Optimized query hook with debouncing and smart refetch
 */
export function useOptimizedQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    debounce?: number;
    enableOnFocus?: boolean;
  }
) {
  const { debounce = 0, enableOnFocus = false, ...queryOptions } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();

  const query = useQuery({
    ...queryOptions,
    refetchOnWindowFocus: enableOnFocus,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (debounce > 0) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        query.refetch();
      }, debounce);

      return () => clearTimeout(timeoutRef.current);
    }
  }, [debounce, query]);

  return query;
}
