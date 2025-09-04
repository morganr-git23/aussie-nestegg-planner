import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash2, TrendingUp, X, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Asset } from '@/domain/forecastEngine';
import { formatCurrency } from '@/domain/constants';

interface EditableAssetsFormProps {
  assets: Asset[];
  scenarioId: string;
  onAssetsChange: (assets: Asset[]) => void;
}

const ASSET_TYPES = [
  { value: 'cash', label: 'Cash/Savings', icon: DollarSign, color: 'text-blue-600' },
  { value: 'shares', label: 'Shares/ETFs', icon: TrendingUp, color: 'text-green-600' },
  { value: 'super', label: 'Superannuation', icon: TrendingUp, color: 'text-purple-600' },
  { value: 'other', label: 'Other Investment', icon: TrendingUp, color: 'text-orange-600' },
] as const;

const EditableAssetsForm: React.FC<EditableAssetsFormProps> = ({
  assets,
  scenarioId,
  onAssetsChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    assetType: 'cash' as Asset['assetType'],
    currentValueCents: 0,
    growthRatePa: 0,
    contributionMonthlyCents: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      assetType: 'cash',
      currentValueCents: 0,
      growthRatePa: 0,
      contributionMonthlyCents: 0,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const assetData = {
        scenario_id: scenarioId,
        name: formData.name,
        asset_type: formData.assetType,
        current_value_cents: formData.currentValueCents * 100,
        growth_rate_pa: formData.growthRatePa / 100,
        contribution_monthly_cents: formData.contributionMonthlyCents * 100,
      };

      let result;
      if (editingId) {
        // Update existing asset
        result = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', editingId)
          .select()
          .single();
      } else {
        // Create new asset
        result = await supabase
          .from('assets')
          .insert(assetData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      const savedAsset: Asset = {
        id: result.data.id,
        scenarioId: result.data.scenario_id,
        name: result.data.name,
        assetType: result.data.asset_type as Asset['assetType'],
        currentValueCents: result.data.current_value_cents,
        growthRatePa: result.data.growth_rate_pa,
        contributionMonthlyCents: result.data.contribution_monthly_cents,
      };

      let updatedAssets;
      if (editingId) {
        updatedAssets = assets.map(a => a.id === editingId ? savedAsset : a);
      } else {
        updatedAssets = [...assets, savedAsset];
      }

      onAssetsChange(updatedAssets);
      resetForm();

      toast({
        title: editingId ? 'Asset Updated' : 'Asset Added',
        description: `${formData.name} has been ${editingId ? 'updated' : 'added'} successfully.`,
      });
    } catch (error) {
      console.error('Error saving asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to save asset. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (asset: Asset) => {
    setFormData({
      name: asset.name,
      assetType: asset.assetType,
      currentValueCents: asset.currentValueCents / 100,
      growthRatePa: asset.growthRatePa * 100,
      contributionMonthlyCents: asset.contributionMonthlyCents / 100,
    });
    setEditingId(asset.id);
    setIsAdding(true);
  };

  const handleDelete = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      const updatedAssets = assets.filter(a => a.id !== assetId);
      onAssetsChange(updatedAssets);

      toast({
        title: 'Asset Deleted',
        description: 'Asset has been removed from the scenario.',
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete asset. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getAssetTypeInfo = (type: Asset['assetType']) => {
    return ASSET_TYPES.find(t => t.value === type) || ASSET_TYPES[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Current Assets & Investments
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </CardTitle>
        <CardDescription>
          Track your current savings, investments, and other assets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assets.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No assets added</h3>
            <p className="text-muted-foreground mb-4">
              Add your current savings and investments for accurate modeling
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Asset
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {assets.map((asset) => {
              const typeInfo = getAssetTypeInfo(asset.assetType);
              const Icon = typeInfo.icon;
              
              return (
                <Card key={asset.id} className="border-l-4 border-l-success">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                          <h3 className="font-medium">{asset.name}</h3>
                          <Badge variant="outline">{typeInfo.label}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Value:</span> {formatCurrency(asset.currentValueCents)}
                          </div>
                          <div>
                            <span className="font-medium">Growth:</span> {(asset.growthRatePa * 100).toFixed(1)}% p.a.
                          </div>
                          <div>
                            <span className="font-medium">Contribution:</span> {formatCurrency(asset.contributionMonthlyCents)}/month
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(asset)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(asset.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {isAdding && (
              <Card className="border-2 border-dashed border-success">
                <CardContent className="p-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Asset Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Emergency Fund, VDHG ETF"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Asset Type *</Label>
                        <Select 
                          value={formData.assetType} 
                          onValueChange={(value) => setFormData({ ...formData, assetType: value as Asset['assetType'] })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSET_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="value">Current Value ($)</Label>
                        <Input
                          id="value"
                          type="number"
                          value={formData.currentValueCents}
                          onChange={(e) => setFormData({ ...formData, currentValueCents: Number(e.target.value) })}
                          placeholder="50000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="growth">Growth Rate (% p.a.)</Label>
                        <Input
                          id="growth"
                          type="number"
                          step="0.1"
                          value={formData.growthRatePa}
                          onChange={(e) => setFormData({ ...formData, growthRatePa: Number(e.target.value) })}
                          placeholder="7"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="contribution">Monthly Contribution ($)</Label>
                        <Input
                          id="contribution"
                          type="number"
                          value={formData.contributionMonthlyCents}
                          onChange={(e) => setFormData({ ...formData, contributionMonthlyCents: Number(e.target.value) })}
                          placeholder="1000"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        {editingId ? 'Update Asset' : 'Add Asset'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EditableAssetsForm;