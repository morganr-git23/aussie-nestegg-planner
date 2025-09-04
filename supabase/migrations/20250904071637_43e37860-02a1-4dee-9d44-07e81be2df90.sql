-- Create user profiles table for Australian property planning
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE,
  retirement_age INTEGER DEFAULT 65,
  inflation_cpi_pa DECIMAL(5,2) DEFAULT 2.5,
  wage_growth_pa DECIMAL(5,2) DEFAULT 3.0,
  return_super_pa DECIMAL(5,2) DEFAULT 7.0,
  return_portfolio_pa DECIMAL(5,2) DEFAULT 8.0,
  tax_marginal_rate DECIMAL(5,2) DEFAULT 0.37,
  medicare_levy_pct DECIMAL(5,2) DEFAULT 2.0,
  state_code TEXT DEFAULT 'NSW',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  purchase_price_cents BIGINT NOT NULL,
  purchase_date DATE NOT NULL,
  value_now_cents BIGINT NOT NULL,
  value_growth_pa DECIMAL(5,2) DEFAULT 6.0,
  costs_fixed_pa_cents BIGINT DEFAULT 0,
  maintenance_pct_of_value DECIMAL(5,2) DEFAULT 1.0,
  strata_pa_cents BIGINT DEFAULT 0,
  rates_pa_cents BIGINT DEFAULT 0,
  insurance_pa_cents BIGINT DEFAULT 0,
  land_tax_pa_cents BIGINT DEFAULT 0,
  rent_pw_cents BIGINT DEFAULT 0,
  vacancy_weeks_pa INTEGER DEFAULT 2,
  depreciation_capital_pa_cents BIGINT DEFAULT 0,
  depreciation_plant_pa_cents BIGINT DEFAULT 0,
  becomes_ip_on DATE,
  becomes_ppor_on DATE,
  sold_on DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  start_balance_cents BIGINT NOT NULL,
  rate_pa DECIMAL(5,2) NOT NULL,
  io_years INTEGER DEFAULT 0,
  term_years INTEGER DEFAULT 30,
  offset_start_cents BIGINT DEFAULT 0,
  offset_contrib_monthly_cents BIGINT DEFAULT 0,
  allow_redraw BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scenarios table
CREATE TABLE public.scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  start_date DATE NOT NULL,
  horizon_years INTEGER DEFAULT 30,
  stress_rate_bump_pct DECIMAL(5,2) DEFAULT 0,
  stress_growth_haircut_pct DECIMAL(5,2) DEFAULT 0,
  stress_vacancy_weeks INTEGER DEFAULT 0,
  stress_borrow_cap_down_pct DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan events table
CREATE TABLE public.plan_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('buy', 'sell', 'refinance', 'move_in', 'move_out', 'new_car', 'crash_pad_on', 'crash_pad_off', 'super_topup')),
  amount_cents BIGINT,
  meta_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for properties
CREATE POLICY "Users can view their own properties" ON public.properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON public.properties
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for loans
CREATE POLICY "Users can view loans for their properties" ON public.loans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = loans.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create loans for their properties" ON public.loans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = loans.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update loans for their properties" ON public.loans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = loans.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete loans for their properties" ON public.loans
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = loans.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Create RLS policies for scenarios
CREATE POLICY "Users can view their own scenarios" ON public.scenarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scenarios" ON public.scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios" ON public.scenarios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios" ON public.scenarios
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for plan_events
CREATE POLICY "Users can view events for their scenarios" ON public.plan_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scenarios 
      WHERE scenarios.id = plan_events.scenario_id 
      AND scenarios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events for their scenarios" ON public.plan_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenarios 
      WHERE scenarios.id = plan_events.scenario_id 
      AND scenarios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update events for their scenarios" ON public.plan_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.scenarios 
      WHERE scenarios.id = plan_events.scenario_id 
      AND scenarios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete events for their scenarios" ON public.plan_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.scenarios 
      WHERE scenarios.id = plan_events.scenario_id 
      AND scenarios.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON public.scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_loans_property_id ON public.loans(property_id);
CREATE INDEX idx_scenarios_user_id ON public.scenarios(user_id);
CREATE INDEX idx_plan_events_scenario_id ON public.plan_events(scenario_id);
CREATE INDEX idx_plan_events_date ON public.plan_events(event_date);