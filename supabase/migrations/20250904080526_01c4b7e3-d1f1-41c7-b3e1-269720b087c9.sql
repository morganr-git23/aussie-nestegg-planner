-- Temporarily disable RLS on all tables for demo purposes
-- This allows the demo to work without authentication

ALTER TABLE public.scenarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_events DISABLE ROW LEVEL SECURITY;