-- Fix RLS policies for search_rate_limit table
-- First drop existing policies if they exist
DROP POLICY IF EXISTS "System can read rate limits" ON search_rate_limit;
DROP POLICY IF EXISTS "System can manage rate limits" ON search_rate_limit;
DROP POLICY IF EXISTS "Users can view own rate limit" ON search_rate_limit;

-- Policy 1: Allow the system (SECURITY DEFINER functions) to SELECT data
-- This is needed for check_search_rate_limit() to read rate limit counters
CREATE POLICY "System can read rate limits"
ON search_rate_limit
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow the system to INSERT and UPDATE rate limit records
-- This is needed for check_search_rate_limit() to record and update search counts
CREATE POLICY "System can insert rate limits"
ON search_rate_limit
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "System can update rate limits"
ON search_rate_limit
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 3: Allow the system to DELETE old rate limit records
-- This is needed for check_search_rate_limit() cleanup of old records
CREATE POLICY "System can delete rate limits"
ON search_rate_limit
FOR DELETE
TO authenticated
USING (true);

COMMENT ON POLICY "System can read rate limits" ON search_rate_limit IS 
'Allows SECURITY DEFINER functions to check rate limit counters';

COMMENT ON POLICY "System can insert rate limits" ON search_rate_limit IS 
'Allows SECURITY DEFINER functions to insert new rate limit records';

COMMENT ON POLICY "System can update rate limits" ON search_rate_limit IS 
'Allows SECURITY DEFINER functions to update rate limit counters';

COMMENT ON POLICY "System can delete rate limits" ON search_rate_limit IS 
'Allows SECURITY DEFINER functions to cleanup old rate limit records';