import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Home, DollarSign, Calculator, AlertTriangle, Plus, Settings, User, CreditCard } from 'lucide-react';
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

import EditablePropertyForm from './forms/EditablePropertyForm';
import EditableLoanForm from './forms/EditableLoanForm';
import EditableProfileForm from './forms/EditableProfileForm';
import ScenarioManager from './ScenarioManager';

const EditableDashboard: React.FC = () => {
  const [userId] = useState('550e8400-e29b-41d4-a716-446655440000'); // Demo UUID - in real app, get from auth
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [forecast, setForecast] = useState<ForecastMonth[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stressMode, setStressMode] = useState(false);
  
  // Edit modes
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [addingProperty, setAddingProperty] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [addingLoan, setAddingLoan] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (currentScenario) {
      runScenarioForecast(currentScenario);
    }
  }, [currentScenario, stressMode]);

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
    if (currentScenario) {
      setStressMode(!stressMode);
    }
  };

  const handleScenarioChange = (scenario: Scenario) => {
    setCurrentScenario(scenario);
    setLoading(false);
  };

  const handleProfileSave = async (profile: UserProfile) => {
    if (currentScenario) {
      const updatedScenario = { ...currentScenario, profile };
      setCurrentScenario(updatedScenario);
      setEditingProfile(false);
      
      toast({
        title: 'Profile Updated',
        description: 'Profile changes have been saved successfully.',
      });
    }
  };

  const handlePropertySave = async (property: Property) => {
    if (currentScenario) {
      let updatedProperties = [...currentScenario.properties];
      
      if (editingPropertyId) {
        // Update existing property
        const index = updatedProperties.findIndex(p => p.id === editingPropertyId);
        if (index !== -1) {
          updatedProperties[index] = property;
        }
        setEditingPropertyId(null);
      } else {
        // Add new property
        updatedProperties.push(property);
        setAddingProperty(false);
      }
      
      const updatedScenario = { ...currentScenario, properties: updatedProperties };
      setCurrentScenario(updatedScenario);
    }
  };

  const handlePropertyDelete = async (propertyId: string) => {
    if (currentScenario) {
      const updatedProperties = currentScenario.properties.filter(p => p.id !== propertyId);
      const updatedLoans = currentScenario.loans.filter(l => {
        // Remove loans associated with this property (we'd need to track property-loan relationships)
        return true; // For now, keep all loans
      });
      
      const updatedScenario = { 
        ...currentScenario, 
        properties: updatedProperties,
        loans: updatedLoans
      };
      setCurrentScenario(updatedScenario);
      setEditingPropertyId(null);
    }
  };

  const handleLoanSave = async (loan: LoanDetails) => {
    if (currentScenario) {
      let updatedLoans = [...currentScenario.loans];
      
      if (editingLoanId) {
        // Update existing loan
        const index = updatedLoans.findIndex(l => l.id === editingLoanId);
        if (index !== -1) {
          updatedLoans[index] = loan;
        }
        setEditingLoanId(null);
      } else {
        // Add new loan
        updatedLoans.push(loan);
        setAddingLoan(false);
      }
      
      const updatedScenario = { ...currentScenario, loans: updatedLoans };
      setCurrentScenario(updatedScenario);
    }
  };

  const handleLoanDelete = async (loanId: string) => {
    if (currentScenario) {
      const updatedLoans = currentScenario.loans.filter(l => l.id !== loanId);
      const updatedScenario = { ...currentScenario, loans: updatedLoans };
      setCurrentScenario(updatedScenario);
      setEditingLoanId(null);
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

  if (loading && !currentScenario) {
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
              {currentScenario && (
                <>
                  <Badge variant="secondary" className="px-3 py-1">
                    <Home className="w-4 h-4 mr-2" />
                    {currentScenario.properties.length} Properties
                  </Badge>
                  <Button 
                    variant="secondary" 
                    onClick={toggleStressTest}
                    className="transition-smooth"
                  >
                    {stressMode ? 'Base Case' : 'Stress Test'}
                    {stressMode && <AlertTriangle className="w-4 h-4 ml-2" />}
                  </Button>
                </>
              )}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Scenario Manager */}
          <div className="lg:col-span-1">
            <ScenarioManager
              currentScenario={currentScenario}
              onScenarioChange={handleScenarioChange}
              userId={userId}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!currentScenario ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Scenario Selected</h3>
                  <p className="text-muted-foreground">
                    Select or create a scenario to start modeling your property investments.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="loans">Loans</TabsTrigger>
                  <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {summary && (
                    <>
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
                    </>
                  )}
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          User Profile
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setEditingProfile(!editingProfile)}
                        >
                          {editingProfile ? 'Cancel' : 'Edit Profile'}
                        </Button>
                      </CardTitle>
                      <CardDescription>Personal details and economic assumptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {editingProfile ? (
                        <EditableProfileForm
                          profile={currentScenario.profile}
                          userId={userId}
                          onSave={handleProfileSave}
                          onCancel={() => setEditingProfile(false)}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Name</div>
                              <div className="text-lg font-semibold">{currentScenario.profile.name}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Tax Rate</div>
                              <div className="text-lg font-semibold">
                                {((currentScenario.profile.taxMarginalRate + currentScenario.profile.medicareLevy) * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">State</div>
                              <div className="text-lg font-semibold">{currentScenario.profile.stateCode}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Properties Tab */}
                <TabsContent value="properties" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Home className="w-5 h-5" />
                          Property Portfolio
                        </span>
                        <Button
                          onClick={() => setAddingProperty(true)}
                          disabled={addingProperty}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Property
                        </Button>
                      </CardTitle>
                      <CardDescription>Manage your property investments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {addingProperty && (
                        <EditablePropertyForm
                          userId={userId}
                          onSave={handlePropertySave}
                          onCancel={() => setAddingProperty(false)}
                        />
                      )}
                      
                      {currentScenario.properties.map((property) => (
                        <div key={property.id}>
                          {editingPropertyId === property.id ? (
                            <EditablePropertyForm
                              property={property}
                              userId={userId}
                              onSave={handlePropertySave}
                              onCancel={() => setEditingPropertyId(null)}
                              onDelete={handlePropertyDelete}
                            />
                          ) : (
                            <Card className="shadow-soft border-l-4 border-l-primary">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Home className="w-6 h-6 text-primary" />
                                    <div>
                                      <CardTitle className="text-lg">{property.name}</CardTitle>
                                      <CardDescription>
                                        {formatCurrency(property.valueNowCents)} • {property.rentPwCents > 0 ? `$${(property.rentPwCents / 100).toFixed(0)}/week` : 'No rent'}
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingPropertyId(property.id)}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </CardHeader>
                            </Card>
                          )}
                        </div>
                      ))}
                      
                      {currentScenario.properties.length === 0 && !addingProperty && (
                        <div className="text-center py-8">
                          <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No properties yet</h3>
                          <p className="text-muted-foreground">Add your first property to start modeling</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Loans Tab */}
                <TabsContent value="loans" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Loan Management
                        </span>
                        <Button
                          onClick={() => setAddingLoan(true)}
                          disabled={addingLoan || currentScenario.properties.length === 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Loan
                        </Button>
                      </CardTitle>
                      <CardDescription>Track loans and offset accounts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {addingLoan && currentScenario.properties.length > 0 && (
                        <EditableLoanForm
                          propertyId={currentScenario.properties[0].id}
                          onSave={handleLoanSave}
                          onCancel={() => setAddingLoan(false)}
                        />
                      )}
                      
                      {currentScenario.loans.map((loan) => (
                        <div key={loan.id}>
                          {editingLoanId === loan.id ? (
                            <EditableLoanForm
                              loan={{ ...loan, propertyId: currentScenario.properties[0]?.id || '' }}
                              onSave={handleLoanSave}
                              onCancel={() => setEditingLoanId(null)}
                              onDelete={handleLoanDelete}
                            />
                          ) : (
                            <Card className="shadow-soft border-l-4 border-l-accent">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="w-6 h-6 text-accent" />
                                    <div>
                                      <CardTitle className="text-lg">Loan {loan.id}</CardTitle>
                                      <CardDescription>
                                        {formatCurrency(loan.startBalanceCents)} • {(loan.annualRate * 100).toFixed(2)}% p.a.
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingLoanId(loan.id)}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </CardHeader>
                            </Card>
                          )}
                        </div>
                      ))}
                      
                      {currentScenario.loans.length === 0 && !addingLoan && (
                        <div className="text-center py-8">
                          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No loans yet</h3>
                          <p className="text-muted-foreground">Add loans to model your financing strategy</p>
                        </div>
                      )}
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
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditableDashboard;