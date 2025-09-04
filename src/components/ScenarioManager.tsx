import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, Copy, Trash2, Settings, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Scenario, UserProfile, Property } from '@/domain/forecastEngine';
import type { LoanDetails } from '@/domain/loanEngine';

interface ScenarioManagerProps {
  currentScenario?: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
  userId: string;
}

const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  currentScenario,
  onScenarioChange,
  userId,
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioNotes, setNewScenarioNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadScenarios();
  }, [userId]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      
      // Load scenarios
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (scenariosError) throw scenariosError;

      // Load user profile - use maybeSingle to avoid errors if no profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('No profile found for user:', userId, profileError);
      }

      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId);

      if (propertiesError) throw propertiesError;

      // Load loans for all properties
      const propertyIds = propertiesData?.map(p => p.id) || [];
      let loansData: any[] = [];
      
      if (propertyIds.length > 0) {
        const { data, error: loansError } = await supabase
          .from('loans')
          .select('*')
          .in('property_id', propertyIds);

        if (loansError) throw loansError;
        loansData = data || [];
      }

      // Transform data to domain models
      const profile: UserProfile | undefined = profileData ? {
        id: profileData.id,
        name: profileData.name,
        dateOfBirth: new Date(profileData.date_of_birth),
        retirementAge: profileData.retirement_age,
        inflationCpiPa: profileData.inflation_cpi_pa,
        wageGrowthPa: profileData.wage_growth_pa,
        returnSuperPa: profileData.return_super_pa,
        returnPortfolioPa: profileData.return_portfolio_pa,
        taxMarginalRate: profileData.tax_marginal_rate,
        medicareLevy: profileData.medicare_levy_pct,
        stateCode: profileData.state_code,
      } : undefined;

      const properties: Property[] = propertiesData?.map(p => ({
        id: p.id,
        name: p.name,
        purchasePriceCents: p.purchase_price_cents,
        purchaseDate: new Date(p.purchase_date),
        valueNowCents: p.value_now_cents,
        valueGrowthPa: p.value_growth_pa,
        costsFixedPaCents: p.costs_fixed_pa_cents,
        maintenancePctOfValue: p.maintenance_pct_of_value,
        strataPaCents: p.strata_pa_cents,
        ratesPaCents: p.rates_pa_cents,
        insurancePaCents: p.insurance_pa_cents,
        landTaxPaCents: p.land_tax_pa_cents,
        rentPwCents: p.rent_pw_cents,
        vacancyWeeksPa: p.vacancy_weeks_pa,
        depreciationCapitalPaCents: p.depreciation_capital_pa_cents,
        depreciationPlantPaCents: p.depreciation_plant_pa_cents,
        becomesIpOn: p.becomes_ip_on ? new Date(p.becomes_ip_on) : undefined,
        becomesPporOn: p.becomes_ppor_on ? new Date(p.becomes_ppor_on) : undefined,
        soldOn: p.sold_on ? new Date(p.sold_on) : undefined,
      })) || [];

      const loans: LoanDetails[] = loansData.map(l => ({
        id: l.id,
        startDate: new Date(l.start_date),
        startBalanceCents: l.start_balance_cents,
        annualRate: l.rate_pa,
        ioYears: l.io_years,
        termYears: l.term_years,
        offsetStartCents: l.offset_start_cents,
        offsetContribMonthlyCents: l.offset_contrib_monthly_cents,
        allowRedraw: l.allow_redraw,
      }));

      const transformedScenarios: Scenario[] = scenariosData?.map(s => ({
        id: s.id,
        userId: s.user_id,
        name: s.name,
        notes: s.notes,
        startDate: new Date(s.start_date),
        horizonYears: s.horizon_years,
        profile: profile || {
          id: 'default-profile',
          name: 'Demo User',
          dateOfBirth: new Date('1985-06-15'),
          retirementAge: 65,
          inflationCpiPa: 0.025,
          wageGrowthPa: 0.03,
          returnSuperPa: 0.07,
          returnPortfolioPa: 0.08,
          taxMarginalRate: 0.37,
          medicareLevy: 0.02,
          stateCode: 'NSW',
        },
        properties,
        loans,
        stressRateBumpPct: s.stress_rate_bump_pct,
        stressGrowthHaircutPct: s.stress_growth_haircut_pct,
        stressVacancyWeeks: s.stress_vacancy_weeks,
        stressBorrowCapDownPct: s.stress_borrow_cap_down_pct,
      })) || [];

      setScenarios(transformedScenarios);

      // If no current scenario, select the first one
      if (!currentScenario && transformedScenarios.length > 0) {
        onScenarioChange(transformedScenarios[0]);
      }
      
      // Always call this to let parent know loading is done
      setLoading(false);
    } catch (error) {
      console.error('Error loading scenarios:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scenarios. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async () => {
    if (!newScenarioName.trim()) return;

    setIsCreating(true);
    try {
      const scenarioData = {
        user_id: userId,
        name: newScenarioName.trim(),
        notes: newScenarioNotes.trim() || null,
        start_date: new Date().toISOString().split('T')[0],
        horizon_years: 30,
        stress_rate_bump_pct: 0,
        stress_growth_haircut_pct: 0,
        stress_vacancy_weeks: 0,
        stress_borrow_cap_down_pct: 0,
      };

      const { data, error } = await supabase
        .from('scenarios')
        .insert(scenarioData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Scenario Created',
        description: `${newScenarioName} has been created successfully.`,
      });

      setNewScenarioName('');
      setNewScenarioNotes('');
      await loadScenarios();
    } catch (error) {
      console.error('Error creating scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to create scenario. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const duplicateScenario = async (scenario: Scenario) => {
    try {
      const scenarioData = {
        user_id: userId,
        name: `${scenario.name} (Copy)`,
        notes: scenario.notes,
        start_date: scenario.startDate.toISOString().split('T')[0],
        horizon_years: scenario.horizonYears,
        stress_rate_bump_pct: scenario.stressRateBumpPct,
        stress_growth_haircut_pct: scenario.stressGrowthHaircutPct,
        stress_vacancy_weeks: scenario.stressVacancyWeeks,
        stress_borrow_cap_down_pct: scenario.stressBorrowCapDownPct,
      };

      const { data, error } = await supabase
        .from('scenarios')
        .insert(scenarioData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Scenario Duplicated',
        description: `Copy of ${scenario.name} has been created.`,
      });

      await loadScenarios();
    } catch (error) {
      console.error('Error duplicating scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate scenario. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteScenario = async (scenarioId: string) => {
    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      toast({
        title: 'Scenario Deleted',
        description: 'Scenario has been deleted successfully.',
      });

      await loadScenarios();
      
      // If deleted scenario was current, clear it
      if (currentScenario?.id === scenarioId) {
        const remainingScenarios = scenarios.filter(s => s.id !== scenarioId);
        if (remainingScenarios.length > 0) {
          onScenarioChange(remainingScenarios[0]);
        }
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete scenario. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Scenario Manager
        </CardTitle>
        <CardDescription>
          Create and manage different property investment scenarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scenarios" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scenarios">My Scenarios</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-4">
            {scenarios.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No scenarios yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first scenario to start modeling property investments
                </p>
                <Button onClick={() => setNewScenarioName('My First Scenario')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Scenario
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <Card key={scenario.id} className={cn(
                    'cursor-pointer transition-all',
                    currentScenario?.id === scenario.id && 'ring-2 ring-primary'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1"
                          onClick={() => onScenarioChange(scenario)}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-medium">{scenario.name}</h3>
                              {scenario.notes && (
                                <p className="text-sm text-muted-foreground">{scenario.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">
                              {scenario.properties.length} Properties
                            </Badge>
                            <Badge variant="outline">
                              {scenario.loans.length} Loans
                            </Badge>
                            <Badge variant="outline">
                              {scenario.horizonYears} Years
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateScenario(scenario)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteScenario(scenario.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenarioName">Scenario Name</Label>
                <Input
                  id="scenarioName"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="e.g., Conservative Growth Strategy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scenarioNotes">Notes (Optional)</Label>
                <Textarea
                  id="scenarioNotes"
                  value={newScenarioNotes}
                  onChange={(e) => setNewScenarioNotes(e.target.value)}
                  placeholder="Describe this scenario's strategy and assumptions"
                  rows={3}
                />
              </div>

              <Button
                onClick={createScenario}
                disabled={isCreating || !newScenarioName.trim()}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create Scenario'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ScenarioManager;