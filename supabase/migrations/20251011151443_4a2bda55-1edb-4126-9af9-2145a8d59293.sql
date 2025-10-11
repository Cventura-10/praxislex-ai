-- Fix missing constraints for user signup

-- Ensure user_profiles has primary key on id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_pkey' 
    AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Ensure clients has unique constraint on auth_user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_auth_user_id_key' 
    AND conrelid = 'public.clients'::regclass
  ) THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

-- Verify the constraints exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_pkey') THEN
    RAISE EXCEPTION 'user_profiles primary key constraint not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_auth_user_id_key') THEN
    RAISE EXCEPTION 'clients unique constraint not created';
  END IF;
END $$;