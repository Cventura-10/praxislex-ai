-- Enable RLS on search_rate_limit table for security
ALTER TABLE search_rate_limit ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed for search_rate_limit as it's only accessed by the search function
-- which runs with SECURITY DEFINER and manages rate limiting server-side

COMMENT ON TABLE search_rate_limit IS 'Internal table for search rate limiting - no direct user access';