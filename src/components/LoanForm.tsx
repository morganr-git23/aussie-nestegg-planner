import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Percent, Calendar, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/domain/constants';
import { calculateLoanSchedule, calculateOffsetSavings } from '@/domain/loanEngine';
import type { LoanDetails } from '@/domain/loanEngine';

interface LoanFormProps {
  loan: LoanDetails;
}

const LoanForm: React.FC<LoanFormProps> = ({ loan }) => {
  const schedule = calculateLoanSchedule(loan, 360); // 30 years
  const offsetSavings = calculateOffsetSavings(loan, 360);
  const currentMonth = schedule.months[0];
  const totalLoanTerm = loan.termYears * 12;
  const progressPercent = Math.min(100, (schedule.months.length / totalLoanTerm) * 100);

  return (
    <div className="space-y-4">
      <Card className="shadow-soft border-l-4 border-l-accent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-accent" />
              <div>
                <CardTitle className="text-lg">Loan {loan.id}</CardTitle>
                <CardDescription>
                  Started {loan.startDate.toLocaleDateString('en-AU')}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {(loan.annualRate * 100).toFixed(2)}% p.a.
              </Badge>
              {loan.ioYears > 0 && (
                <Badge variant="outline">
                  {loan.ioYears}y IO
                </Badge>
              )}
              {loan.allowRedraw && (
                <Badge variant="outline">
                  Redraw
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loan Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                Current Balance
              </Label>
              <div className="text-2xl font-bold text-destructive">
                {currentMonth ? formatCurrency(currentMonth.endingBalance) : formatCurrency(loan.startBalanceCents)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <TrendingDown className="w-4 h-4 mr-1" />
                Offset Balance
              </Label>
              <div className="text-2xl font-bold text-success">
                {currentMonth ? formatCurrency(currentMonth.offsetBalance) : formatCurrency(loan.offsetStartCents)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Percent className="w-4 h-4 mr-1" />
                Monthly Payment
              </Label>
              <div className="text-2xl font-bold text-primary">
                {currentMonth ? formatCurrency(currentMonth.totalPayment) : '$0'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Effective Rate
              </Label>
              <div className="text-2xl font-bold text-accent">
                {currentMonth && currentMonth.effectiveBalance > 0 
                  ? ((currentMonth.interestCharged * 12 / currentMonth.effectiveBalance) * 100).toFixed(2)
                  : '0.00'
                }%
              </div>
            </div>
          </div>

          {/* Loan Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Loan Progress</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercent)}% Complete
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Loan Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`start-balance-${loan.id}`}>Original Balance</Label>
              <Input
                id={`start-balance-${loan.id}`}
                value={formatCurrency(loan.startBalanceCents)}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`rate-${loan.id}`}>Interest Rate</Label>
              <Input
                id={`rate-${loan.id}`}
                value={`${(loan.annualRate * 100).toFixed(2)}% p.a.`}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`term-${loan.id}`}>Loan Term</Label>
              <Input
                id={`term-${loan.id}`}
                value={`${loan.termYears} years`}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`io-period-${loan.id}`}>Interest Only Period</Label>
              <Input
                id={`io-period-${loan.id}`}
                value={`${loan.ioYears} years`}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`offset-contrib-${loan.id}`}>Monthly Offset Contribution</Label>
              <Input
                id={`offset-contrib-${loan.id}`}
                value={formatCurrency(loan.offsetContribMonthlyCents)}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`offset-savings-${loan.id}`}>Total Offset Savings</Label>
              <Input
                id={`offset-savings-${loan.id}`}
                value={formatCurrency(offsetSavings)}
                readOnly
                className="bg-muted text-success"
              />
            </div>
          </div>

          {/* Current Month Details */}
          {currentMonth && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Current Month Breakdown</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Interest</div>
                  <div className="text-lg font-semibold text-destructive">
                    {formatCurrency(currentMonth.interestCharged)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Principal</div>
                  <div className="text-lg font-semibold text-primary">
                    {formatCurrency(currentMonth.principalPayment)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Total Payment</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(currentMonth.totalPayment)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Effective Balance</div>
                  <div className="text-lg font-semibold text-accent">
                    {formatCurrency(currentMonth.effectiveBalance)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loan Summary Stats */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Loan Summary (30 Years)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Total Interest Payable</Label>
                <div className="text-xl font-bold text-destructive">
                  {formatCurrency(schedule.totalInterest)}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Total Payments</Label>
                <div className="text-xl font-bold">
                  {formatCurrency(schedule.totalPayments)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanForm;