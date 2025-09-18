import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { db, auth } from '../../lib/supabase';

interface StudentFormProps {
  onSubmit: (student: any) => void;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'defaultpass123', // Default password for demo
    rollNumber: '',
    percentage: '',
    domain: '',
    backlogs: '',
    skills: '',
    academicYear: '',
    department: ''
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
          role: 'student'
        }
      );

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create student profile
      const percentage = parseInt(formData.backlogs) > 0 ? 0 : parseFloat(formData.percentage);
      const { data: studentData, error: studentError } = await db.createStudent({
        user_id: authData.user.id,
        roll_number: formData.rollNumber,
        percentage,
        domain: formData.domain,
        backlogs: parseInt(formData.backlogs),
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(s => s),
        academic_year: formData.academicYear,
        department: formData.department
      });

      if (studentError) throw studentError;

      onSubmit(studentData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const domainOptions = [
    { value: '', label: 'Select Domain' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'ai-ml', label: 'AI/ML' },
    { value: 'cybersecurity', label: 'Cybersecurity' },
    { value: 'blockchain', label: 'Blockchain' },
    { value: 'iot', label: 'Internet of Things' },
    { value: 'cloud-computing', label: 'Cloud Computing' }
  ];

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
        
        <Input
          label="Roll Number"
          value={formData.rollNumber}
          onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
          required
        />
        
        <Input
          label="Percentage"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formData.percentage}
          onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
          required
        />
        
        <Select
          label="Domain"
          options={domainOptions}
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          required
        />
        
        <Input
          label="Number of Backlogs"
          type="number"
          min="0"
          value={formData.backlogs}
          onChange={(e) => setFormData({ ...formData, backlogs: e.target.value })}
          required
        />
        
        <Input
          label="Academic Year"
          value={formData.academicYear}
          onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
          placeholder="e.g., 2024-25"
          required
        />
        
        <Select
          label="Department"
          options={departmentOptions}
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
        />
      </div>
      
      <Input
        label="Skills (comma-separated)"
        value={formData.skills}
        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
        placeholder="React, Node.js, Python, etc."
        helperText="Enter skills separated by commas"
      />
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Add Student
        </Button>
      </div>
    </form>
    </div>
  );
};