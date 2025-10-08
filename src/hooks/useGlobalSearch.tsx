import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { debounce } from "@/lib/performance";

export interface SearchResult {
  entity_type: 'case' | 'client' | 'document' | 'invoice';
  entity_id: string;
  title: string;
  description: string | null;
  reference: string | null;
  rank: number;
  created_at: string;
}

/**
 * Hook for global search functionality
 * Provides full-text search across all entities
 */
export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const search = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResults([]);
        return;
      }

      const { data, error } = await supabase.rpc('search_entities', {
        p_query: searchQuery.trim(),
        p_user_id: user.id,
        p_limit: 20,
      });

      if (error) {
        console.error('Search error:', error);
        setResults([]);
        return;
      }

      const typedResults = (data || []).map(item => ({
        ...item,
        entity_type: item.entity_type as 'case' | 'client' | 'document' | 'invoice',
      }));

      setResults(typedResults);

      // Save to recent searches
      if (typedResults.length > 0) {
        const recent = [searchQuery, ...recentSearches.filter(r => r !== searchQuery)].slice(0, 5);
        setRecentSearches(recent);
        localStorage.setItem('praxislex-recent-searches', JSON.stringify(recent));
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce(search, 300),
    [recentSearches]
  );

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setResults([]);
    }
  }, [query, debouncedSearch]);

  useEffect(() => {
    const saved = localStorage.getItem('praxislex-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('praxislex-recent-searches');
  };

  return {
    query,
    setQuery,
    results,
    loading,
    recentSearches,
    clearRecentSearches,
  };
}
