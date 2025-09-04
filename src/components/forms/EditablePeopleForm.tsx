import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Save, Trash2, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Person } from '@/domain/forecastEngine';
import { formatCurrency } from '@/domain/constants';

interface EditablePeopleFormProps {
  people: Person[];
  scenarioId: string;
  onPeopleChange: (people: Person[]) => void;
}

const EditablePeopleForm: React.FC<EditablePeopleFormProps> = ({
  people,
  scenarioId,
  onPeopleChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: new Date('1990-01-01'),
    salaryCurrentCents: 0,
    salaryGrowthPa: 0.03,
    superCurrentCents: 0,
    isPrimary: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      dateOfBirth: new Date('1990-01-01'),
      salaryCurrentCents: 0,
      salaryGrowthPa: 0.03,
      superCurrentCents: 0,
      isPrimary: false,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const personData = {
        scenario_id: scenarioId,
        name: formData.name,
        date_of_birth: formData.dateOfBirth.toISOString().split('T')[0],
        salary_current_cents: formData.salaryCurrentCents * 100,
        salary_growth_pa: formData.salaryGrowthPa,
        super_current_cents: formData.superCurrentCents * 100,
        is_primary: formData.isPrimary,
      };

      let result;
      if (editingId) {
        // Update existing person
        result = await supabase
          .from('people')
          .update(personData)
          .eq('id', editingId)
          .select()
          .single();
      } else {
        // Create new person
        result = await supabase
          .from('people')
          .insert(personData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      const savedPerson: Person = {
        id: result.data.id,
        scenarioId: result.data.scenario_id,
        name: result.data.name,
        dateOfBirth: result.data.date_of_birth ? new Date(result.data.date_of_birth) : undefined,
        salaryCurrentCents: result.data.salary_current_cents,
        salaryGrowthPa: result.data.salary_growth_pa,
        superCurrentCents: result.data.super_current_cents,
        isPrimary: result.data.is_primary,
      };

      let updatedPeople;
      if (editingId) {
        updatedPeople = people.map(p => p.id === editingId ? savedPerson : p);
      } else {
        updatedPeople = [...people, savedPerson];
      }

      onPeopleChange(updatedPeople);
      resetForm();

      toast({
        title: editingId ? 'Person Updated' : 'Person Added',
        description: `${formData.name} has been ${editingId ? 'updated' : 'added'} successfully.`,
      });
    } catch (error) {
      console.error('Error saving person:', error);
      toast({
        title: 'Error',
        description: 'Failed to save person. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (person: Person) => {
    setFormData({
      name: person.name,
      dateOfBirth: person.dateOfBirth || new Date('1990-01-01'),
      salaryCurrentCents: person.salaryCurrentCents / 100,
      salaryGrowthPa: person.salaryGrowthPa,
      superCurrentCents: person.superCurrentCents / 100,
      isPrimary: person.isPrimary,
    });
    setEditingId(person.id);
    setIsAdding(true);
  };

  const handleDelete = async (personId: string) => {
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', personId);

      if (error) throw error;

      const updatedPeople = people.filter(p => p.id !== personId);
      onPeopleChange(updatedPeople);

      toast({
        title: 'Person Deleted',
        description: 'Person has been removed from the scenario.',
      });
    } catch (error) {
      console.error('Error deleting person:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete person. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            People in Scenario
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Person
          </Button>
        </CardTitle>
        <CardDescription>
          Manage multiple people in this scenario for family modeling
        </CardDescription>
      </CardHeader>
      <CardContent>
        {people.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No people added</h3>
            <p className="text-muted-foreground mb-4">
              Add people to model family financial scenarios
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Person
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {people.map((person) => (
              <Card key={person.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{person.name}</h3>
                        {person.isPrimary && (
                          <Badge variant="secondary">Primary</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Salary:</span> {formatCurrency(person.salaryCurrentCents)}
                        </div>
                        <div>
                          <span className="font-medium">Super:</span> {formatCurrency(person.superCurrentCents)}
                        </div>
                        <div>
                          <span className="font-medium">Age:</span> {
                            person.dateOfBirth ? Math.floor((Date.now() - person.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(person)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(person.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {isAdding && (
              <Card className="border-2 border-dashed border-primary">
                <CardContent className="p-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., John Smith"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !formData.dateOfBirth && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.dateOfBirth ? format(formData.dateOfBirth, 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.dateOfBirth}
                              onSelect={(date) => setFormData({ ...formData, dateOfBirth: date || new Date() })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary">Current Salary ($)</Label>
                        <Input
                          id="salary"
                          type="number"
                          value={formData.salaryCurrentCents}
                          onChange={(e) => setFormData({ ...formData, salaryCurrentCents: Number(e.target.value) })}
                          placeholder="80000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salaryGrowth">Salary Growth (%)</Label>
                        <Input
                          id="salaryGrowth"
                          type="number"
                          step="0.01"
                          value={formData.salaryGrowthPa * 100}
                          onChange={(e) => setFormData({ ...formData, salaryGrowthPa: Number(e.target.value) / 100 })}
                          placeholder="3"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="super">Current Super ($)</Label>
                        <Input
                          id="super"
                          type="number"
                          value={formData.superCurrentCents}
                          onChange={(e) => setFormData({ ...formData, superCurrentCents: Number(e.target.value) })}
                          placeholder="150000"
                        />
                      </div>

                      <div className="space-y-2 flex items-end">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.isPrimary}
                            onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                          />
                          <span className="text-sm">Primary person</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        {editingId ? 'Update Person' : 'Add Person'}
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

export default EditablePeopleForm;