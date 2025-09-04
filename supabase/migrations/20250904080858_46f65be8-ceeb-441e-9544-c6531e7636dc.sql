-- Add missing financial fields to user profiles
ALTER TABLE public.user_profiles 
ADD COLUMN salary_current_cents bigint DEFAULT 0,
ADD COLUMN salary_growth_pa numeric DEFAULT 3.0,
ADD COLUMN savings_current_cents bigint DEFAULT 0,
ADD COLUMN super_current_cents bigint DEFAULT 0,
ADD COLUMN other_investments_cents bigint DEFAULT 0,
ADD COLUMN living_expenses_pa_cents bigint DEFAULT 0;

-- Create a people table for multiple people in scenarios
CREATE TABLE public.people (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id uuid NOT NULL,
    name text NOT NULL,
    date_of_birth date,
    salary_current_cents bigint DEFAULT 0,
    salary_growth_pa numeric DEFAULT 3.0,
    super_current_cents bigint DEFAULT 0,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create trigger for people table
CREATE TRIGGER update_people_updated_at
    BEFORE UPDATE ON public.people
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add current assets tracking table
CREATE TABLE public.assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id uuid NOT NULL,
    name text NOT NULL,
    asset_type text NOT NULL, -- 'cash', 'shares', 'super', 'other'
    current_value_cents bigint NOT NULL DEFAULT 0,
    growth_rate_pa numeric DEFAULT 0.0,
    contribution_monthly_cents bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create trigger for assets table
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();