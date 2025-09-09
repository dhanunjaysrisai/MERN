import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { WeeklyLog } from '../../types';

interface WeeklyLogFormProps {
  onSubmit: (log: Omit<WeeklyLog, 'id' | 'submittedAt' | 'guideApproval'>) => void;
  onCancel: () => void;
  teamId: string;
  currentWeek: number;
}

export const WeeklyLogForm: React.FC<WeeklyLogFormProps> = ({ 
  onSubmit, 
  onCancel, 
  teamId,
  currentWeek 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    completedTasks: '',
    nextWeekPlans: '',
    challenges: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      teamId,
      week: currentWeek,
      title: formData.title,
      description: formData.description,
      completedTasks: formData.completedTasks.split('\n').filter(task => task.trim()),
      nextWeekPlans: formData.nextWeekPlans.split('\n').filter(plan => plan.trim()),
      challenges: formData.challenges.split('\n').filter(challenge => challenge.trim()),
      submittedBy: 'current-user-id' // This would come from auth context
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Week Number"
          value={currentWeek.toString()}
          disabled
        />
        
        <Input
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Week summary title"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Brief description of this week's progress"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Completed Tasks (one per line)
        </label>
        <textarea
          value={formData.completedTasks}
          onChange={(e) => setFormData({ ...formData, completedTasks: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Task 1&#10;Task 2&#10;Task 3"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Next Week Plans (one per line)
        </label>
        <textarea
          value={formData.nextWeekPlans}
          onChange={(e) => setFormData({ ...formData, nextWeekPlans: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Plan 1&#10;Plan 2&#10;Plan 3"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Challenges Faced (one per line)
        </label>
        <textarea
          value={formData.challenges}
          onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Challenge 1&#10;Challenge 2"
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Submit Weekly Log</Button>
      </div>
    </form>
  );
};