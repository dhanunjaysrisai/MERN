import React, { useState } from 'react';
import { Users, Calendar, Upload, BarChart3, Plus } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { TeamDetailsModal } from '../components/teams/TeamDetailsModal';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { WeeklyLogForm } from '../components/weekly-logs/WeeklyLogForm';
import { WeeklyLog } from '../types';

export const StudentDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'team' | 'logs' | 'documents'>('overview');
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);

  // Mock data - in real app, this would come from API
  const myTeam = {
    id: 'team-1',
    name: 'Web Dev Team Alpha',
    members: [
      { id: '1', name: 'John Doe', email: 'john@example.com', rollNumber: '21CS001', percentage: 85, domain: 'web-development', backlogs: 0, skills: ['React', 'Node.js'], teamId: 'team-1', isTeamLead: true },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', rollNumber: '21CS002', percentage: 80, domain: 'web-development', backlogs: 1, skills: ['React', 'Python'], teamId: 'team-1' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', rollNumber: '21CS003', percentage: 78, domain: 'web-development', backlogs: 0, skills: ['JavaScript', 'CSS'], teamId: 'team-1' },
      { id: '4', name: 'Alice Brown', email: 'alice@example.com', rollNumber: '21CS004', percentage: 82, domain: 'web-development', backlogs: 0, skills: ['React', 'MongoDB'], teamId: 'team-1' }
    ],
    projectTitle: 'E-commerce Platform',
    domain: 'web-development',
    averagePercentage: 81.25
  };

  const handleSubmitLog = (logData: Omit<WeeklyLog, 'id' | 'submittedAt' | 'guideApproval'>) => {
    const newLog: WeeklyLog = {
      ...logData,
      id: `log-${Date.now()}`,
      submittedAt: new Date(),
      guideApproval: false
    };
    setWeeklyLogs([...weeklyLogs, newLog]);
    setShowLogForm(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Team Members"
          value={myTeam.members.length}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Weekly Logs"
          value={weeklyLogs.length}
          icon={Calendar}
          color="green"
        />
        <StatsCard
          title="Documents"
          value={5}
          icon={Upload}
          color="yellow"
        />
        <StatsCard
          title="Team Average"
          value={`${myTeam.averagePercentage}%`}
          icon={BarChart3}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Project Overview</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Project Title</p>
                <p className="font-medium">{myTeam.projectTitle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Domain</p>
                <Badge variant="primary">{myTeam.domain}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Team Performance</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${myTeam.averagePercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{myTeam.averagePercentage}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => setShowLogForm(true)}
              className="w-full justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit Weekly Log
            </Button>
            <Button 
              className="w-full justify-start"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Team</h2>
        <Button 
          onClick={() => setSelectedTeam(myTeam)}
          variant="outline"
        >
          View Full Details
        </Button>
      </div>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{myTeam.name}</h3>
          <p className="text-gray-600">{myTeam.projectTitle}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTeam.members.map(member => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{member.name}</h4>
                  {member.isTeamLead && <Badge variant="primary">Team Lead</Badge>}
                </div>
                <p className="text-sm text-gray-600">{member.rollNumber}</p>
                <p className="text-sm text-gray-600">{member.percentage}%</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {member.skills.map(skill => (
                    <span key={skill} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Weekly Logs</h2>
        <Button onClick={() => setShowLogForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Submit Log
        </Button>
      </div>

      {showLogForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Submit Weekly Log</h3>
          </CardHeader>
          <CardContent>
            <WeeklyLogForm
              onSubmit={handleSubmitLog}
              onCancel={() => setShowLogForm(false)}
              teamId={myTeam.id}
              currentWeek={weeklyLogs.length + 1}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {weeklyLogs.map(log => (
          <Card key={log.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Week {log.week}: {log.title}</h3>
                <Badge variant={log.guideApproval ? 'success' : 'warning'}>
                  {log.guideApproval ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{log.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Completed Tasks</h4>
                  <ul className="text-sm space-y-1">
                    {log.completedTasks.map((task, index) => (
                      <li key={index}>• {task}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Next Week Plans</h4>
                  <ul className="text-sm space-y-1">
                    {log.nextWeekPlans.map((plan, index) => (
                      <li key={index}>• {plan}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Challenges</h4>
                  <ul className="text-sm space-y-1">
                    {log.challenges.map((challenge, index) => (
                      <li key={index}>• {challenge}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'team':
        return renderTeam();
      case 'logs':
        return renderLogs();
      case 'documents':
        return <div>Documents view coming soon...</div>;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-gray-200">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'team', label: 'My Team' },
          { key: 'logs', label: 'Weekly Logs' },
          { key: 'documents', label: 'Documents' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCurrentView(key as any)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
              currentView === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {renderContent()}
      
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          userRole="team_lead"
        />
      )}
    </div>
  );
};