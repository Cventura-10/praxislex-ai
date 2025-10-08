-- Fix RLS policies for search_rate_limit table
-- The table needs policies to allow SECURITY DEFINER functions to work properly

-- Policy 1: Allow SECURITY DEFINER functions to read all rate limit data
-- This is needed for check_search_rate_limit() to work
CREATE POLICY "System can read rate limits"
ON search_rate_limit
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow SECURITY DEFINER functions to insert/update rate limit records
-- This is needed for check_search_rate_limit() to record searches
CREATE POLICY "System can manage rate limits"
ON search_rate_limit
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 3: Allow users to view their own rate limit status (optional, for transparency)
-- This allows users to check if they're being rate limited
CREATE POLICY "Users can view own rate limit"
ON search_rate_limit
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON POLICY "System can read rate limits" ON search_rate_limit IS 
'Allows SECURITY DEFINER functions to check rate limit counters across all users';

COMMENT ON POLICY "System can manage rate limits" ON search_rate_limit IS 
'Allows SECURITY DEFINER functions to insert/update rate limit records';

COMMENT ON POLICY "Users can view own rate limit" ON search_rate_limit IS 
'Allows users to view their own rate limit status for transparency';