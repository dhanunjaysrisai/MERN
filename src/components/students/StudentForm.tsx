import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Student } from '../../types';

interface StudentFormProps {
  onSubmit: (student: Omit<Student, 'id'>) => void;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    percentage: '',
    domain: '',
    backlogs: '',
    skills: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const percentage = parseInt(formData.backlogs) > 0 ? 0 : parseFloat(formData.percentage);
    onSubmit({
      ...formData,
      percentage,
      backlogs: parseInt(formData.backlogs),
      skills: formData.skills.split(',').map(skill => skill.trim())
    });
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
        <Button type="submit">Add Student</Button>
      </div>
    </form>
  );
};