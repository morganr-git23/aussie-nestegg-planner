import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Home, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '@/domain/constants';
import type { Property } from '@/domain/forecastEngine';

interface PropertyFormProps {
  property: Property;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ property }) => {
  const annualRent = property.rentPwCents * (52 - property.vacancyWeeksPa);
  const grossYield = (annualRent / property.valueNowCents) * 100;

  return (
    <div className="space-y-4">
      <Card className="shadow-soft border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-lg">{property.name}</CardTitle>
                <CardDescription>
                  Purchased {property.purchaseDate.toLocaleDateString('en-AU')}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {property.becomesIpOn ? 'IP' : 'PPOR'}
              </Badge>
              <Badge variant="outline">
                {grossYield.toFixed(1)}% Yield
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Current Value
              </Label>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(property.valueNowCents)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                Growth Rate
              </Label>
              <div className="text-2xl font-bold text-success">
                {(property.valueGrowthPa * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Weekly Rent
              </Label>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(property.rentPwCents)}
              </div>
            </div>
          </div>

          {/* Property Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`purchase-price-${property.id}`}>Purchase Price</Label>
              <Input
                id={`purchase-price-${property.id}`}
                value={formatCurrency(property.purchasePriceCents)}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`fixed-costs-${property.id}`}>Fixed Costs (Annual)</Label>
              <Input
                id={`fixed-costs-${property.id}`}
                value={formatCurrency(property.costsFixedPaCents)}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`maintenance-${property.id}`}>Maintenance (% of Value)</Label>
              <Input
                id={`maintenance-${property.id}`}
                value={`${(property.maintenancePctOfValue * 100).toFixed(1)}%`}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`strata-${property.id}`}>Strata Fees (Annual)</Label>
              <Input
                id={`strata-${property.id}`}
                value={formatCurrency(property.strataPaCents)}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`rates-${property.id}`}>Council Rates (Annual)</Label>
              <Input
                id={`rates-${property.id}`}
                value={formatCurrency(property.ratesPaCents)}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`insurance-${property.id}`}>Insurance (Annual)</Label>
              <Input
                id={`insurance-${property.id}`}
                value={formatCurrency(property.insurancePaCents)}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`vacancy-${property.id}`}>Vacancy (Weeks/Year)</Label>
              <Input
                id={`vacancy-${property.id}`}
                value={property.vacancyWeeksPa}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`annual-rent-${property.id}`}>Annual Rent (Net)</Label>
              <Input
                id={`annual-rent-${property.id}`}
                value={formatCurrency(annualRent)}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`gross-yield-${property.id}`}>Gross Yield</Label>
              <Input
                id={`gross-yield-${property.id}`}
                value={`${grossYield.toFixed(2)}%`}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {/* Investment Property Dates */}
          {(property.becomesIpOn || property.becomesPporOn || property.soldOn) && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Key Dates</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {property.becomesIpOn && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Becomes IP</Label>
                    <div className="text-sm font-medium">
                      {property.becomesIpOn.toLocaleDateString('en-AU')}
                    </div>
                  </div>
                )}
                {property.becomesPporOn && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Becomes PPOR</Label>
                    <div className="text-sm font-medium">
                      {property.becomesPporOn.toLocaleDateString('en-AU')}
                    </div>
                  </div>
                )}
                {property.soldOn && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Sold On</Label>
                    <div className="text-sm font-medium">
                      {property.soldOn.toLocaleDateString('en-AU')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyForm;