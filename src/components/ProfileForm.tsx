import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, TrendingUp, Percent } from 'lucide-react';
import { AU_STATES } from '@/domain/constants';
import type { UserProfile } from '@/domain/forecastEngine';

interface ProfileFormProps {
  profile: UserProfile;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile }) => {
  const currentAge = Math.floor(
    (Date.now() - profile.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const yearsToRetirement = profile.retirementAge - currentAge;
  const stateName = AU_STATES.find(s => s.code === profile.stateCode)?.name || profile.stateCode;

  return (
    <div className="space-y-4">
      <Card className="shadow-soft border-l-4 border-l-success">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-success" />
              <div>
                <CardTitle className="text-lg">{profile.name}</CardTitle>
                <CardDescription>
                  Age {currentAge} • {stateName}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                <Calendar className="w-4 h-4 mr-1" />
                {yearsToRetirement} years to retirement
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                value={profile.dateOfBirth.toLocaleDateString('en-AU')}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retirement-age">Retirement Age</Label>
              <Input
                id="retirement-age"
                value={profile.retirementAge}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={`${profile.stateCode} - ${stateName}`}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marginal-rate">Marginal Tax Rate</Label>
              <Input
                id="marginal-rate"
                value={`${(profile.taxMarginalRate * 100).toFixed(1)}%`}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicare-levy">Medicare Levy</Label>
              <Input
                id="medicare-levy"
                value={`${(profile.medicareLevy * 100).toFixed(1)}%`}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {/* Economic Assumptions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Economic Assumptions
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inflation">Inflation (CPI)</Label>
                <Input
                  id="inflation"
                  value={`${(profile.inflationCpiPa * 100).toFixed(1)}% p.a.`}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wage-growth">Wage Growth</Label>
                <Input
                  id="wage-growth"
                  value={`${(profile.wageGrowthPa * 100).toFixed(1)}% p.a.`}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="super-return">Super Return</Label>
                <Input
                  id="super-return"
                  value={`${(profile.returnSuperPa * 100).toFixed(1)}% p.a.`}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio-return">Portfolio Return</Label>
                <Input
                  id="portfolio-return"
                  value={`${(profile.returnPortfolioPa * 100).toFixed(1)}% p.a.`}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center">
              <Percent className="w-4 h-4 mr-2" />
              Key Metrics
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Current Age</div>
                <div className="text-2xl font-bold text-primary">
                  {currentAge}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Years to Retirement</div>
                <div className="text-2xl font-bold text-accent">
                  {yearsToRetirement}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Total Tax Rate</div>
                <div className="text-2xl font-bold text-destructive">
                  {((profile.taxMarginalRate + profile.medicareLevy) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Assumptions Note */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-warning mt-0.5" />
              <div className="space-y-1">
                <div className="font-medium text-warning">Economic Assumptions</div>
                <div className="text-sm text-muted-foreground">
                  These economic assumptions are used for long-term forecasting. 
                  Actual results may vary significantly due to market conditions, 
                  policy changes, and other economic factors.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileForm;