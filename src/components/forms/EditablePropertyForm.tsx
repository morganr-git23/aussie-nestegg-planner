import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Home, DollarSign, TrendingUp, Save, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Property } from '@/domain/forecastEngine';

const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  purchasePriceCents: z.number().min(0, 'Purchase price must be positive'),
  purchaseDate: z.date(),
  valueNowCents: z.number().min(0, 'Current value must be positive'),
  valueGrowthPa: z.number().min(0).max(1, 'Growth rate must be between 0% and 100%'),
  costsFixedPaCents: z.number().min(0, 'Fixed costs must be positive or zero'),
  maintenancePctOfValue: z.number().min(0).max(1, 'Maintenance % must be between 0% and 100%'),
  strataPaCents: z.number().min(0, 'Strata fees must be positive or zero'),
  ratesPaCents: z.number().min(0, 'Council rates must be positive or zero'),
  insurancePaCents: z.number().min(0, 'Insurance must be positive or zero'),
  landTaxPaCents: z.number().min(0, 'Land tax must be positive or zero'),
  rentPwCents: z.number().min(0, 'Weekly rent must be positive or zero'),
  vacancyWeeksPa: z.number().min(0).max(52, 'Vacancy weeks must be between 0 and 52'),
  depreciationCapitalPaCents: z.number().min(0, 'Capital depreciation must be positive or zero'),
  depreciationPlantPaCents: z.number().min(0, 'Plant depreciation must be positive or zero'),
  becomesIpOn: z.date().optional(),
  becomesPporOn: z.date().optional(),
  soldOn: z.date().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface EditablePropertyFormProps {
  property?: Property;
  userId: string;
  onSave?: (property: Property) => void;
  onCancel?: () => void;
  onDelete?: (propertyId: string) => void;
}

const EditablePropertyForm: React.FC<EditablePropertyFormProps> = ({
  property,
  userId,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: property ? {
      name: property.name,
      purchasePriceCents: property.purchasePriceCents / 100,
      purchaseDate: new Date(property.purchaseDate),
      valueNowCents: property.valueNowCents / 100,
      valueGrowthPa: property.valueGrowthPa,
      costsFixedPaCents: property.costsFixedPaCents / 100,
      maintenancePctOfValue: property.maintenancePctOfValue,
      strataPaCents: property.strataPaCents / 100,
      ratesPaCents: property.ratesPaCents / 100,
      insurancePaCents: property.insurancePaCents / 100,
      landTaxPaCents: property.landTaxPaCents / 100,
      rentPwCents: property.rentPwCents / 100,
      vacancyWeeksPa: property.vacancyWeeksPa,
      depreciationCapitalPaCents: property.depreciationCapitalPaCents / 100,
      depreciationPlantPaCents: property.depreciationPlantPaCents / 100,
      becomesIpOn: property.becomesIpOn ? new Date(property.becomesIpOn) : undefined,
      becomesPporOn: property.becomesPporOn ? new Date(property.becomesPporOn) : undefined,
      soldOn: property.soldOn ? new Date(property.soldOn) : undefined,
    } : {
      name: '',
      purchasePriceCents: 0,
      purchaseDate: new Date(),
      valueNowCents: 0,
      valueGrowthPa: 0.06,
      costsFixedPaCents: 0,
      maintenancePctOfValue: 0.01,
      strataPaCents: 0,
      ratesPaCents: 0,
      insurancePaCents: 0,
      landTaxPaCents: 0,
      rentPwCents: 0,
      vacancyWeeksPa: 2,
      depreciationCapitalPaCents: 0,
      depreciationPlantPaCents: 0,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      const propertyData = {
        name: data.name,
        user_id: userId,
        purchase_price_cents: Math.round(data.purchasePriceCents * 100),
        purchase_date: data.purchaseDate.toISOString().split('T')[0],
        value_now_cents: Math.round(data.valueNowCents * 100),
        value_growth_pa: data.valueGrowthPa,
        costs_fixed_pa_cents: Math.round(data.costsFixedPaCents * 100),
        maintenance_pct_of_value: data.maintenancePctOfValue,
        strata_pa_cents: Math.round(data.strataPaCents * 100),
        rates_pa_cents: Math.round(data.ratesPaCents * 100),
        insurance_pa_cents: Math.round(data.insurancePaCents * 100),
        land_tax_pa_cents: Math.round(data.landTaxPaCents * 100),
        rent_pw_cents: Math.round(data.rentPwCents * 100),
        vacancy_weeks_pa: data.vacancyWeeksPa,
        depreciation_capital_pa_cents: Math.round(data.depreciationCapitalPaCents * 100),
        depreciation_plant_pa_cents: Math.round(data.depreciationPlantPaCents * 100),
        becomes_ip_on: data.becomesIpOn ? data.becomesIpOn.toISOString().split('T')[0] : null,
        becomes_ppor_on: data.becomesPporOn ? data.becomesPporOn.toISOString().split('T')[0] : null,
        sold_on: data.soldOn ? data.soldOn.toISOString().split('T')[0] : null,
      };

      let result;
      if (property?.id) {
        // Update existing property
        result = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id)
          .select()
          .single();
      } else {
        // Create new property
        result = await supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      const savedProperty: Property = {
        id: result.data.id,
        name: result.data.name,
        purchasePriceCents: result.data.purchase_price_cents,
        purchaseDate: new Date(result.data.purchase_date),
        valueNowCents: result.data.value_now_cents,
        valueGrowthPa: result.data.value_growth_pa,
        costsFixedPaCents: result.data.costs_fixed_pa_cents,
        maintenancePctOfValue: result.data.maintenance_pct_of_value,
        strataPaCents: result.data.strata_pa_cents,
        ratesPaCents: result.data.rates_pa_cents,
        insurancePaCents: result.data.insurance_pa_cents,
        landTaxPaCents: result.data.land_tax_pa_cents,
        rentPwCents: result.data.rent_pw_cents,
        vacancyWeeksPa: result.data.vacancy_weeks_pa,
        depreciationCapitalPaCents: result.data.depreciation_capital_pa_cents,
        depreciationPlantPaCents: result.data.depreciation_plant_pa_cents,
        becomesIpOn: result.data.becomes_ip_on ? new Date(result.data.becomes_ip_on) : undefined,
        becomesPporOn: result.data.becomes_ppor_on ? new Date(result.data.becomes_ppor_on) : undefined,
        soldOn: result.data.sold_on ? new Date(result.data.sold_on) : undefined,
      };

      toast({
        title: property ? 'Property Updated' : 'Property Created',
        description: `${data.name} has been ${property ? 'updated' : 'created'} successfully.`,
      });

      onSave?.(savedProperty);
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: 'Error',
        description: 'Failed to save property. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!property?.id) return;
    
    setIsDeleting(true);
    try {
      const result = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (result.error) {
        throw result.error;
      }

      toast({
        title: 'Property Deleted',
        description: `${property.name} has been deleted successfully.`,
      });

      onDelete?.(property.id);
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete property. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const annualRent = watchedValues.rentPwCents * (52 - watchedValues.vacancyWeeksPa);
  const grossYield = watchedValues.valueNowCents > 0 ? (annualRent / watchedValues.valueNowCents) * 100 : 0;

  return (
    <Card className="shadow-soft border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-lg">
                {property ? 'Edit Property' : 'Add New Property'}
              </CardTitle>
              <CardDescription>
                {property ? `Editing ${property.name}` : 'Create a new property investment'}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {grossYield.toFixed(1)}% Yield
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Ralph Street Apartment"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Purchase Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watchedValues.purchaseDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedValues.purchaseDate ? format(watchedValues.purchaseDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedValues.purchaseDate}
                    onSelect={(date) => setValue('purchaseDate', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($) *</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="1000"
                {...register('purchasePriceCents', { valueAsNumber: true })}
                placeholder="950000"
              />
              {errors.purchasePriceCents && (
                <p className="text-sm text-destructive">{errors.purchasePriceCents.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valueNow">Current Value ($) *</Label>
              <Input
                id="valueNow"
                type="number"
                step="1000"
                {...register('valueNowCents', { valueAsNumber: true })}
                placeholder="1100000"
              />
              {errors.valueNowCents && (
                <p className="text-sm text-destructive">{errors.valueNowCents.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valueGrowth">Annual Growth Rate (%) *</Label>
              <Input
                id="valueGrowth"
                type="number"
                step="0.01"
                {...register('valueGrowthPa', { valueAsNumber: true })}
                placeholder="0.06"
              />
              {errors.valueGrowthPa && (
                <p className="text-sm text-destructive">{errors.valueGrowthPa.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentPw">Weekly Rent ($)</Label>
              <Input
                id="rentPw"
                type="number"
                {...register('rentPwCents', { valueAsNumber: true })}
                placeholder="1300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vacancyWeeks">Vacancy Weeks/Year</Label>
              <Input
                id="vacancyWeeks"
                type="number"
                {...register('vacancyWeeksPa', { valueAsNumber: true })}
                placeholder="2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance">Maintenance (% of Value)</Label>
              <Input
                id="maintenance"
                type="number"
                step="0.001"
                {...register('maintenancePctOfValue', { valueAsNumber: true })}
                placeholder="0.01"
              />
            </div>
          </div>

          {/* Operating Costs */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Annual Operating Costs</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fixedCosts">Fixed Costs ($)</Label>
                <Input
                  id="fixedCosts"
                  type="number"
                  {...register('costsFixedPaCents', { valueAsNumber: true })}
                  placeholder="20000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strata">Strata Fees ($)</Label>
                <Input
                  id="strata"
                  type="number"
                  {...register('strataPaCents', { valueAsNumber: true })}
                  placeholder="4000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rates">Council Rates ($)</Label>
                <Input
                  id="rates"
                  type="number"
                  {...register('ratesPaCents', { valueAsNumber: true })}
                  placeholder="2000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance ($)</Label>
                <Input
                  id="insurance"
                  type="number"
                  {...register('insurancePaCents', { valueAsNumber: true })}
                  placeholder="1500"
                />
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
              {isSubmitting ? 'Saving...' : (property ? 'Update Property' : 'Create Property')}
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
            
            {property && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditablePropertyForm;