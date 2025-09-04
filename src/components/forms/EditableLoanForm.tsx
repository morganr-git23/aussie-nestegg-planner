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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CreditCard, Save, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { LoanDetails } from '@/domain/loanEngine';

const loanSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  startDate: z.date(),
  startBalanceCents: z.number().min(0, 'Start balance must be positive'),
  annualRate: z.number().min(0).max(1, 'Interest rate must be between 0% and 100%'),
  ioYears: z.number().min(0).max(30, 'IO years must be between 0 and 30'),
  termYears: z.number().min(1).max(50, 'Term must be between 1 and 50 years'),
  offsetStartCents: z.number().min(0, 'Offset start balance must be positive or zero'),
  offsetContribMonthlyCents: z.number().min(0, 'Monthly contribution must be positive or zero'),
  allowRedraw: z.boolean(),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface EditableLoanFormProps {
  loan?: LoanDetails & { propertyId: string };
  propertyId?: string;
  onSave?: (loan: LoanDetails) => void;
  onCancel?: () => void;
  onDelete?: (loanId: string) => void;
}

const EditableLoanForm: React.FC<EditableLoanFormProps> = ({
  loan,
  propertyId,
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
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: loan ? {
      propertyId: loan.propertyId,
      startDate: new Date(loan.startDate),
      startBalanceCents: loan.startBalanceCents / 100,
      annualRate: loan.annualRate,
      ioYears: loan.ioYears,
      termYears: loan.termYears,
      offsetStartCents: loan.offsetStartCents / 100,
      offsetContribMonthlyCents: loan.offsetContribMonthlyCents / 100,
      allowRedraw: loan.allowRedraw,
    } : {
      propertyId: propertyId || '',
      startDate: new Date(),
      startBalanceCents: 0,
      annualRate: 0.06,
      ioYears: 2,
      termYears: 30,
      offsetStartCents: 0,
      offsetContribMonthlyCents: 0,
      allowRedraw: false,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: LoanFormData) => {
    setIsSubmitting(true);
    try {
      const loanData = {
        property_id: data.propertyId,
        start_date: data.startDate.toISOString().split('T')[0],
        start_balance_cents: Math.round(data.startBalanceCents * 100),
        rate_pa: data.annualRate,
        io_years: data.ioYears,
        term_years: data.termYears,
        offset_start_cents: Math.round(data.offsetStartCents * 100),
        offset_contrib_monthly_cents: Math.round(data.offsetContribMonthlyCents * 100),
        allow_redraw: data.allowRedraw,
      };

      let result;
      if (loan?.id) {
        // Update existing loan
        result = await supabase
          .from('loans')
          .update(loanData)
          .eq('id', loan.id)
          .select()
          .single();
      } else {
        // Create new loan
        result = await supabase
          .from('loans')
          .insert(loanData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      const savedLoan: LoanDetails = {
        id: result.data.id,
        startDate: new Date(result.data.start_date),
        startBalanceCents: result.data.start_balance_cents,
        annualRate: result.data.rate_pa,
        ioYears: result.data.io_years,
        termYears: result.data.term_years,
        offsetStartCents: result.data.offset_start_cents,
        offsetContribMonthlyCents: result.data.offset_contrib_monthly_cents,
        allowRedraw: result.data.allow_redraw,
      };

      toast({
        title: loan ? 'Loan Updated' : 'Loan Created',
        description: `Loan has been ${loan ? 'updated' : 'created'} successfully.`,
      });

      onSave?.(savedLoan);
    } catch (error) {
      console.error('Error saving loan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save loan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!loan?.id) return;
    
    setIsDeleting(true);
    try {
      const result = await supabase
        .from('loans')
        .delete()
        .eq('id', loan.id);

      if (result.error) {
        throw result.error;
      }

      toast({
        title: 'Loan Deleted',
        description: 'Loan has been deleted successfully.',
      });

      onDelete?.(loan.id);
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete loan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const monthlyPaymentEstimate = watchedValues.startBalanceCents > 0 ? 
    (watchedValues.startBalanceCents * watchedValues.annualRate / 12) : 0;

  return (
    <Card className="shadow-soft border-l-4 border-l-accent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-accent" />
            <div>
              <CardTitle className="text-lg">
                {loan ? 'Edit Loan' : 'Add New Loan'}
              </CardTitle>
              <CardDescription>
                {loan ? `Editing loan ${loan.id}` : 'Create a new loan for this property'}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {(watchedValues.annualRate * 100).toFixed(2)}% p.a.
            </Badge>
            {watchedValues.ioYears > 0 && (
              <Badge variant="outline">
                {watchedValues.ioYears}y IO
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Loan Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watchedValues.startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedValues.startDate ? format(watchedValues.startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedValues.startDate}
                    onSelect={(date) => setValue('startDate', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startBalance">Starting Balance ($) *</Label>
              <Input
                id="startBalance"
                type="number"
                step="1000"
                {...register('startBalanceCents', { valueAsNumber: true })}
                placeholder="770561"
              />
              {errors.startBalanceCents && (
                <p className="text-sm text-destructive">{errors.startBalanceCents.message}</p>
              )}
            </div>
          </div>

          {/* Interest Rate and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualRate">Interest Rate (%) *</Label>
              <Input
                id="annualRate"
                type="number"
                step="0.01"
                {...register('annualRate', { valueAsNumber: true })}
                placeholder="0.06"
              />
              {errors.annualRate && (
                <p className="text-sm text-destructive">{errors.annualRate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ioYears">Interest Only Period (Years)</Label>
              <Input
                id="ioYears"
                type="number"
                {...register('ioYears', { valueAsNumber: true })}
                placeholder="2"
              />
              {errors.ioYears && (
                <p className="text-sm text-destructive">{errors.ioYears.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="termYears">Total Loan Term (Years) *</Label>
              <Input
                id="termYears"
                type="number"
                {...register('termYears', { valueAsNumber: true })}
                placeholder="30"
              />
              {errors.termYears && (
                <p className="text-sm text-destructive">{errors.termYears.message}</p>
              )}
            </div>
          </div>

          {/* Offset Account Details */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Offset Account</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offsetStart">Starting Balance ($)</Label>
                <Input
                  id="offsetStart"
                  type="number"
                  {...register('offsetStartCents', { valueAsNumber: true })}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offsetContrib">Monthly Contribution ($)</Label>
                <Input
                  id="offsetContrib"
                  type="number"
                  {...register('offsetContribMonthlyCents', { valueAsNumber: true })}
                  placeholder="2000"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Loan Features</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="allowRedraw"
                checked={watchedValues.allowRedraw}
                onCheckedChange={(checked) => setValue('allowRedraw', checked)}
              />
              <Label htmlFor="allowRedraw">Allow Redraw</Label>
            </div>
          </div>

          {/* Estimated Monthly Payment */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <Label className="text-sm font-medium">Estimated Monthly Payment</Label>
            <div className="text-2xl font-bold text-primary">
              ${monthlyPaymentEstimate.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-sm text-muted-foreground">Interest only payment estimate</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : (loan ? 'Update Loan' : 'Create Loan')}
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
            
            {loan && onDelete && (
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

export default EditableLoanForm;