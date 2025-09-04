import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AU_STATES } from '@/domain/constants';
import type { UserProfile } from '@/domain/forecastEngine';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dateOfBirth: z.date(),
  retirementAge: z.number().min(50).max(80, 'Retirement age must be between 50 and 80'),
  inflationCpiPa: z.number().min(0).max(1, 'Inflation rate must be between 0% and 100%'),
  wageGrowthPa: z.number().min(0).max(1, 'Wage growth must be between 0% and 100%'),
  returnSuperPa: z.number().min(0).max(1, 'Super return must be between 0% and 100%'),
  returnPortfolioPa: z.number().min(0).max(1, 'Portfolio return must be between 0% and 100%'),
  taxMarginalRate: z.number().min(0).max(1, 'Tax rate must be between 0% and 100%'),
  medicareLevy: z.number().min(0).max(1, 'Medicare levy must be between 0% and 100%'),
  stateCode: z.string().min(1, 'State is required'),
  // New financial fields
  salaryCurrentCents: z.number().min(0).optional(),
  salaryGrowthPa: z.number().min(0).max(1).optional(),
  savingsCurrentCents: z.number().min(0).optional(),
  superCurrentCents: z.number().min(0).optional(),
  otherInvestmentsCents: z.number().min(0).optional(),
  livingExpensesPaCents: z.number().min(0).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditableProfileFormProps {
  profile?: UserProfile;
  userId: string;
  onSave?: (profile: UserProfile) => void;
  onCancel?: () => void;
}

const EditableProfileForm: React.FC<EditableProfileFormProps> = ({
  profile,
  userId,
  onSave,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile ? {
      name: profile.name,
      dateOfBirth: new Date(profile.dateOfBirth),
      retirementAge: profile.retirementAge,
      inflationCpiPa: profile.inflationCpiPa,
      wageGrowthPa: profile.wageGrowthPa,
      returnSuperPa: profile.returnSuperPa,
      returnPortfolioPa: profile.returnPortfolioPa,
      taxMarginalRate: profile.taxMarginalRate,
      medicareLevy: profile.medicareLevy,
      stateCode: profile.stateCode,
      salaryCurrentCents: profile.salaryCurrentCents / 100,
      salaryGrowthPa: profile.salaryGrowthPa,
      savingsCurrentCents: profile.savingsCurrentCents / 100,
      superCurrentCents: profile.superCurrentCents / 100,
      otherInvestmentsCents: profile.otherInvestmentsCents / 100,
      livingExpensesPaCents: profile.livingExpensesPaCents / 100,
    } : {
      name: '',
      dateOfBirth: new Date('1985-01-01'),
      retirementAge: 65,
      inflationCpiPa: 0.025,
      wageGrowthPa: 0.03,
      returnSuperPa: 0.07,
      returnPortfolioPa: 0.08,
      taxMarginalRate: 0.37,
      medicareLevy: 0.02,
      stateCode: 'NSW',
      salaryCurrentCents: 1200,
      salaryGrowthPa: 0.03,
      savingsCurrentCents: 100,
      superCurrentCents: 5000,
      otherInvestmentsCents: 0,
      livingExpensesPaCents: 600,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const profileData = {
        user_id: userId,
        name: data.name,
        date_of_birth: data.dateOfBirth.toISOString().split('T')[0],
        retirement_age: data.retirementAge,
        inflation_cpi_pa: data.inflationCpiPa,
        wage_growth_pa: data.wageGrowthPa,
        return_super_pa: data.returnSuperPa,
        return_portfolio_pa: data.returnPortfolioPa,
        tax_marginal_rate: data.taxMarginalRate,
        medicare_levy_pct: data.medicareLevy,
        state_code: data.stateCode,
        salary_current_cents: (data.salaryCurrentCents || 0) * 100,
        salary_growth_pa: data.salaryGrowthPa || 0.03,
        savings_current_cents: (data.savingsCurrentCents || 0) * 100,
        super_current_cents: (data.superCurrentCents || 0) * 100,
        other_investments_cents: (data.otherInvestmentsCents || 0) * 100,
        living_expenses_pa_cents: (data.livingExpensesPaCents || 0) * 100,
      };

      let result;
      if (profile?.id) {
        // Update existing profile
        result = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('id', profile.id)
          .select()
          .single();
      } else {
        // Create new profile
        result = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      const savedProfile: UserProfile = {
        id: result.data.id,
        name: result.data.name,
        dateOfBirth: new Date(result.data.date_of_birth),
        retirementAge: result.data.retirement_age,
        inflationCpiPa: result.data.inflation_cpi_pa,
        wageGrowthPa: result.data.wage_growth_pa,
        returnSuperPa: result.data.return_super_pa,
        returnPortfolioPa: result.data.return_portfolio_pa,
        taxMarginalRate: result.data.tax_marginal_rate,
        medicareLevy: result.data.medicare_levy_pct,
        stateCode: result.data.state_code,
        salaryCurrentCents: result.data.salary_current_cents || 0,
        salaryGrowthPa: result.data.salary_growth_pa || 0.03,
        savingsCurrentCents: result.data.savings_current_cents || 0,
        superCurrentCents: result.data.super_current_cents || 0,
        otherInvestmentsCents: result.data.other_investments_cents || 0,
        livingExpensesPaCents: result.data.living_expenses_pa_cents || 0,
      };

      toast({
        title: profile ? 'Profile Updated' : 'Profile Created',
        description: `Profile has been ${profile ? 'updated' : 'created'} successfully.`,
      });

      onSave?.(savedProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAge = Math.floor(
    (Date.now() - watchedValues.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const yearsToRetirement = watchedValues.retirementAge - currentAge;
  const stateName = AU_STATES.find(s => s.code === watchedValues.stateCode)?.name || watchedValues.stateCode;

  return (
    <Card className="shadow-soft border-l-4 border-l-success">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-success" />
            <div>
              <CardTitle className="text-lg">
                {profile ? 'Edit Profile' : 'Create Profile'}
              </CardTitle>
              <CardDescription>
                {profile ? `Editing ${profile.name}` : 'Create your user profile'}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              Age {currentAge} • {stateName}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="John Smith"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watchedValues.dateOfBirth && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedValues.dateOfBirth ? format(watchedValues.dateOfBirth, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedValues.dateOfBirth}
                    onSelect={(date) => setValue('dateOfBirth', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="retirementAge">Retirement Age *</Label>
              <Input
                id="retirementAge"
                type="number"
                {...register('retirementAge', { valueAsNumber: true })}
                placeholder="65"
              />
              {errors.retirementAge && (
                <p className="text-sm text-destructive">{errors.retirementAge.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select value={watchedValues.stateCode} onValueChange={(value) => setValue('stateCode', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {AU_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.stateCode && (
                <p className="text-sm text-destructive">{errors.stateCode.message}</p>
              )}
            </div>
          </div>

          {/* Current Financial Position */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Current Financial Position</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Current Salary ($)</Label>
                <Input
                  id="salary"
                  type="number"
                  {...register('salaryCurrentCents', { valueAsNumber: true })}
                  placeholder="120000"
                />
                {errors.salaryCurrentCents && (
                  <p className="text-sm text-destructive">{errors.salaryCurrentCents.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryGrowth">Salary Growth (%)</Label>
                <Input
                  id="salaryGrowth"
                  type="number"
                  step="0.01"
                  {...register('salaryGrowthPa', { valueAsNumber: true })}
                  placeholder="3"
                />
                {errors.salaryGrowthPa && (
                  <p className="text-sm text-destructive">{errors.salaryGrowthPa.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="savings">Current Savings ($)</Label>
                <Input
                  id="savings"
                  type="number"
                  {...register('savingsCurrentCents', { valueAsNumber: true })}
                  placeholder="50000"
                />
                {errors.savingsCurrentCents && (
                  <p className="text-sm text-destructive">{errors.savingsCurrentCents.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="super">Current Super ($)</Label>
                <Input
                  id="super"
                  type="number"
                  {...register('superCurrentCents', { valueAsNumber: true })}
                  placeholder="200000"
                />
                {errors.superCurrentCents && (
                  <p className="text-sm text-destructive">{errors.superCurrentCents.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherInvestments">Other Investments ($)</Label>
                <Input
                  id="otherInvestments"
                  type="number"
                  {...register('otherInvestmentsCents', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.otherInvestmentsCents && (
                  <p className="text-sm text-destructive">{errors.otherInvestmentsCents.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="livingExpenses">Living Expenses ($/year)</Label>
                <Input
                  id="livingExpenses"
                  type="number"
                  {...register('livingExpensesPaCents', { valueAsNumber: true })}
                  placeholder="60000"
                />
                {errors.livingExpensesPaCents && (
                  <p className="text-sm text-destructive">{errors.livingExpensesPaCents.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tax Settings</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marginalRate">Marginal Tax Rate (%)</Label>
                <Input
                  id="marginalRate"
                  type="number"
                  step="0.01"
                  {...register('taxMarginalRate', { valueAsNumber: true })}
                  placeholder="0.37"
                />
                {errors.taxMarginalRate && (
                  <p className="text-sm text-destructive">{errors.taxMarginalRate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicareLevy">Medicare Levy (%)</Label>
                <Input
                  id="medicareLevy"
                  type="number"
                  step="0.01"
                  {...register('medicareLevy', { valueAsNumber: true })}
                  placeholder="0.02"
                />
                {errors.medicareLevy && (
                  <p className="text-sm text-destructive">{errors.medicareLevy.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Economic Assumptions */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Economic Assumptions</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inflation">Inflation (CPI %)</Label>
                <Input
                  id="inflation"
                  type="number"
                  step="0.001"
                  {...register('inflationCpiPa', { valueAsNumber: true })}
                  placeholder="0.025"
                />
                {errors.inflationCpiPa && (
                  <p className="text-sm text-destructive">{errors.inflationCpiPa.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wageGrowth">Wage Growth (%)</Label>
                <Input
                  id="wageGrowth"
                  type="number"
                  step="0.001"
                  {...register('wageGrowthPa', { valueAsNumber: true })}
                  placeholder="0.03"
                />
                {errors.wageGrowthPa && (
                  <p className="text-sm text-destructive">{errors.wageGrowthPa.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="superReturn">Super Return (%)</Label>
                <Input
                  id="superReturn"
                  type="number"
                  step="0.001"
                  {...register('returnSuperPa', { valueAsNumber: true })}
                  placeholder="0.07"
                />
                {errors.returnSuperPa && (
                  <p className="text-sm text-destructive">{errors.returnSuperPa.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioReturn">Portfolio Return (%)</Label>
                <Input
                  id="portfolioReturn"
                  type="number"
                  step="0.001"
                  {...register('returnPortfolioPa', { valueAsNumber: true })}
                  placeholder="0.08"
                />
                {errors.returnPortfolioPa && (
                  <p className="text-sm text-destructive">{errors.returnPortfolioPa.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics Display */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <Label className="text-sm font-medium mb-3 block">Key Metrics</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Current Age</div>
                <div className="text-2xl font-bold text-primary">{currentAge}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Years to Retirement</div>
                <div className="text-2xl font-bold text-accent">{yearsToRetirement}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Total Tax Rate</div>
                <div className="text-2xl font-bold text-destructive">
                  {((watchedValues.taxMarginalRate + watchedValues.medicareLevy) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditableProfileForm;