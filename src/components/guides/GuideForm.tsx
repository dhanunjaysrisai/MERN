import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Guide } from '../../types';

interface GuideFormProps {
  onSubmit: (guide: Omit<Guide, 'id' | 'currentTeams' | 'assignedTeamIds'>) => void;
  onCancel: () => void;
}

export const GuideForm: React.FC<GuideFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    expertise: '',
    maxTeams: '3'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      maxTeams: parseInt(formData.maxTeams),
      expertise: formData.expertise.split(',').map(skill => skill.trim())
    });
  };

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    { value: 'computer-science', label: 'Computer Science' },
    { value: 'information-technology', label: 'Information Technology' },
    { value: 'electronics', label: 'Electronics & Communication' },
    { value: 'mechanical', label: 'Mechanical Engineering' },
    { value: 'electrical', label: 'Electrical Engineering' },
    { value: 'civil', label: 'Civil Engineering' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        
        <Select
          label="Department"
          options={departmentOptions}
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
        />
        
        <Input
          label="Maximum Teams"
          type="number"
          min="1"
          max="10"
          value={formData.maxTeams}
          onChange={(e) => setFormData({ ...formData, maxTeams: e.target.value })}
          required
        />
      </div>
      
      <Input
        label="Expertise Areas (comma-separated)"
        value={formData.expertise}
        onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
        placeholder="Web Development, AI/ML, Data Science, etc."
        helperText="Enter expertise areas separated by commas"
        required
      />
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Guide</Button>
      </div>
    </form>
  );
};