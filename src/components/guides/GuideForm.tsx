import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { db, auth } from '../../lib/supabase';

interface GuideFormProps {
  onSubmit: (guide: any) => void;
  onCancel: () => void;
}

export const GuideForm: React.FC<GuideFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'defaultpass123', // Default password for demo
    department: '',
    expertise: '',
    maxTeams: '3',
    qualification: '',
    experience: '0'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Create user account
      const { data: authData, error: authError } = await auth.signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.name,
          role: 'guide'
        }
      );

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create guide profile
      const { data: guideData, error: guideError } = await db.createGuide({
        user_id: authData.user.id,
        department: formData.department,
        expertise: formData.expertise.split(',').map(skill => skill.trim()).filter(s => s),
        max_teams: parseInt(formData.maxTeams),
        qualification: formData.qualification,
        experience: parseInt(formData.experience)
      });

      if (guideError) throw guideError;

      onSubmit(guideData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
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
        
        <Input
          label="Qualification"
          value={formData.qualification}
          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
          placeholder="Ph.D, M.Tech, etc."
          required
        />
        
        <Input
          label="Experience (years)"
          type="number"
          min="0"
          value={formData.experience}
          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
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
        <Button type="submit" loading={loading}>
          Add Guide
        </Button>
      </div>
    </form>
    </div>
  );
};