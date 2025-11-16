-- Add health-related fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS conditions text,
ADD COLUMN IF NOT EXISTS medications text,
ADD COLUMN IF NOT EXISTS health_concern text,
ADD COLUMN IF NOT EXISTS goal text;

-- Drop existing insert policy if it exists and recreate it
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);