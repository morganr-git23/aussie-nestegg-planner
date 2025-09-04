import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Home, DollarSign, Calculator, AlertTriangle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { 
  runForecast, 
  generateSummary, 
  formatSummaryForDisplay, 
  applyStressTest,
  type Scenario,
  type UserProfile,
  type Property,
  type ForecastMonth 
} from '@/domain/forecastEngine';
import { formatCurrency } from '@/domain/constants';
import { type LoanDetails } from '@/domain/loanEngine';

import PropertyForm from './PropertyForm';
import LoanForm from './LoanForm';
import ProfileForm from './ProfileForm';

const Dashboard: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [forecast, setForecast] = useState<ForecastMonth[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stressMode, setStressMode] = useState(false);
  const { toast } = useToast();

  // Load demo data
  useEffect(() => {
    loadDemoScenario();
  }, []);

  const loadDemoScenario = async () => {
    try {
      setLoading(true);
      
      // Create demo scenario
      const demoProfile: UserProfile = {
        id: 'demo-profile',
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
        salaryCurrentCents: 12000000, // $120k
        salaryGrowthPa: 0.03,
        savingsCurrentCents: 1000000, // $10k  
        superCurrentCents: 50000000, // $500k
        otherInvestmentsCents: 0,
        livingExpensesPaCents: 6000000, // $60k/year
      };

      const demoProperty: Property = {
        id: 'ralph-street',
        name: 'Ralph Street Apartment',
        purchasePriceCents: 95000000, // $950,000
        purchaseDate: new Date('2020-03-01'),
        valueNowCents: 110000000, // $1,100,000
        valueGrowthPa: 0.06,
        costsFixedPaCents: 2000000, // $20,000
        maintenancePctOfValue: 0.01,
        strataPaCents: 400000, // $4,000
        ratesPaCents: 200000, // $2,000
        insurancePaCents: 150000, // $1,500
        landTaxPaCents: 0,
        rentPwCents: 130000, // $1,300 pw
        vacancyWeeksPa: 2,
        depreciationCapitalPaCents: 0,
        depreciationPlantPaCents: 0,
        becomesIpOn: new Date('2027-01-01'),
      };

      const demoLoan: LoanDetails = {
        id: 'ralph-loan',
        startDate: new Date('2020-03-01'),
        startBalanceCents: 77056100, // $770,561
        annualRate: 0.06,
        ioYears: 2,
        termYears: 30,
        offsetStartCents: 5000000, // $50,000
        offsetContribMonthlyCents: 200000, // $2,000 per month
        allowRedraw: true,
      };

      const demoScenario: Scenario = {
        id: 'demo-scenario',
        userId: 'demo-user',
        name: 'Base Case Scenario',
        startDate: new Date(),
        horizonYears: 30,
        profile: demoProfile,
        properties: [demoProperty],
        loans: [demoLoan],
        people: [],
        assets: [],
        stressRateBumpPct: 0,
        stressGrowthHaircutPct: 0,
        stressVacancyWeeks: 0,
        stressBorrowCapDownPct: 0,
      };

      setScenario(demoScenario);
      runScenarioForecast(demoScenario);
      
      toast({
        title: "Demo Loaded",
        description: "Ralph Street apartment scenario loaded successfully",
      });
    } catch (error) {
      console.error('Error loading demo:', error);
      toast({
        title: "Error",
        description: "Failed to load demo scenario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runScenarioForecast = (scenarioToRun: Scenario) => {
    const activeScenario = stressMode ? applyStressTest(scenarioToRun) : scenarioToRun;
    const forecastResult = runForecast(activeScenario);
    const summaryResult = generateSummary(
      forecastResult,
      activeScenario.profile.retirementAge,
      activeScenario.profile.dateOfBirth
    );
    
    setForecast(forecastResult);
    setSummary(formatSummaryForDisplay(summaryResult));
  };

  const toggleStressTest = () => {
    if (scenario) {
      setStressMode(!stressMode);
      const stressScenario = !stressMode ? {
        ...scenario,
        stressRateBumpPct: 2, // +2% rate bump
        stressGrowthHaircutPct: 2, // -2% growth
        stressVacancyWeeks: 4, // 4 weeks vacancy
      } : scenario;
      
      runScenarioForecast(stressScenario);
    }
  };

  const chartData = forecast.slice(0, 360).filter((_, index) => index % 12 === 0).map(month => ({
    year: Math.floor(month.month / 12),
    netWorth: month.netWorth / 100,
    netWorthPV: month.netWorthPresentValue / 100,
    assets: month.totalAssets / 100,
    debt: month.totalDebt / 100,
    cashflow: month.netCashflow / 100,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Property Planner AU...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-medium">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Property Planner AU</h1>
              <p className="text-primary-foreground/80">
                Australian Property Investment Forecasting & Strategy
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Home className="w-4 h-4 mr-2" />
                {scenario?.properties.length || 0} Properties
              </Badge>
              <Button 
                variant="secondary" 
                onClick={toggleStressTest}
                className="transition-smooth"
              >
                {stressMode ? 'Base Case' : 'Stress Test'}
                {stressMode && <AlertTriangle className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Warning Banner */}
      <Alert className="mx-6 mt-6 border-warning bg-warning/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> These outputs are indicative only and do not constitute 
          financial or tax advice. Please consult qualified professionals for investment decisions.
        </AlertDescription>
      </Alert>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-success text-success-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Net Worth (Today's $)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary?.['Now']?.['Net Worth (Today\'s $)'] || '$0'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Home className="w-4 h-4 mr-2" />
                    Property Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {forecast[0] ? formatCurrency(forecast[0].propertyValues) : '$0'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Total Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary?.['Now']?.['Total Assets'] || '$0'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    Passive Income (4%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary?.['Now']?.['Passive Income (4%)'] || '$0'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Net Worth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Net Worth Projection (30 Years)</CardTitle>
                <CardDescription>
                  Nominal vs Present Value • {stressMode ? 'Stress Test Active' : 'Base Case'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                        labelFormatter={(year) => `Year ${year}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="netWorth" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="Net Worth (Nominal)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="netWorthPV" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Net Worth (Today's $)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Summary Table */}
            {summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                  <CardDescription>Key milestones over your investment horizon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium">Metric</th>
                          <th className="text-right py-2 px-4 font-medium">Now</th>
                          <th className="text-right py-2 px-4 font-medium">10 Years</th>
                          <th className="text-right py-2 px-4 font-medium">20 Years</th>
                          <th className="text-right py-2 px-4 font-medium">Retirement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(summary['Now']).map((metric) => (
                          <tr key={metric} className="border-b">
                            <td className="py-2 px-4 font-medium">{metric}</td>
                            <td className="text-right py-2 px-4">{summary['Now'][metric]}</td>
                            <td className="text-right py-2 px-4">{summary['10 Years'][metric]}</td>
                            <td className="text-right py-2 px-4">{summary['20 Years'][metric]}</td>
                            <td className="text-right py-2 px-4">{summary['Retirement'][metric]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Property Portfolio
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Property
                  </Button>
                </CardTitle>
                <CardDescription>Manage your property investments</CardDescription>
              </CardHeader>
              <CardContent>
                {scenario?.properties.map((property) => (
                  <PropertyForm key={property.id} property={property} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans">
            <Card>
              <CardHeader>
                <CardTitle>Loan Management</CardTitle>
                <CardDescription>Track loans and offset accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {scenario?.loans.map((loan) => (
                  <LoanForm key={loan.id} loan={loan} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecasts Tab */}
          <TabsContent value="forecasts">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Cashflow</CardTitle>
                  <CardDescription>Income vs Expenses over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cashflow" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assets vs Debt</CardTitle>
                  <CardDescription>Balance sheet projection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="assets" stroke="hsl(var(--success))" />
                        <Line type="monotone" dataKey="debt" stroke="hsl(var(--destructive))" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Personal and tax assumptions</CardDescription>
              </CardHeader>
              <CardContent>
                {scenario?.profile && <ProfileForm profile={scenario.profile} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;