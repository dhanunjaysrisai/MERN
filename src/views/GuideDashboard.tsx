import React, { useState } from 'react';
import { Users, FileText, Calendar, Star } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { TeamCard } from '../components/teams/TeamCard';
import { TeamDetailsModal } from '../components/teams/TeamDetailsModal';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Team, WeeklyLog } from '../types';

export const GuideDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'teams' | 'logs' | 'evaluations'>('overview');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Mock data - in real app, this would come from API
  const myTeams: Team[] = [
    {
      id: 'team-1',
      name: 'Web Dev Team Alpha',
      members: [
        { id: '1', name: 'John Doe', email: 'john@example.com', rollNumber: '21CS001', percentage: 85, domain: 'web-development', backlogs: 0, skills: ['React', 'Node.js'], teamId: 'team-1', isTeamLead: true },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', rollNumber: '21CS002', percentage: 80, domain: 'web-development', backlogs: 1, skills: ['React', 'Python'], teamId: 'team-1' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', rollNumber: '21CS003', percentage: 78, domain: 'web-development', backlogs: 0, skills: ['JavaScript', 'CSS'], teamId: 'team-1' },
        { id: '4', name: 'Alice Brown', email: 'alice@example.com', rollNumber: '21CS004', percentage: 82, domain: 'web-development', backlogs: 0, skills: ['React', 'MongoDB'], teamId: 'team-1' }
      ],
      teamLeadId: '1',
      guideId: 'guide-1',
      projectTitle: 'E-commerce Platform',
      domain: 'web-development',
      averagePercentage: 81.25,
      weeklyLogs: [],
      documents: [],
      evaluations: [],
      status: 'active'
    }
  ];

  const pendingLogs: WeeklyLog[] = [
    {
      id: 'log-1',
      teamId: 'team-1',
      week: 3,
      title: 'Frontend Development Progress',
      description: 'Completed user authentication and product catalog',
      completedTasks: ['User login/signup', 'Product listing page', 'Shopping cart'],
      nextWeekPlans: ['Payment integration', 'Order management'],
      challenges: ['API integration issues', 'UI responsiveness'],
      submittedBy: '1',
      submittedAt: new Date(),
      guideApproval: false
    }
  ];

  const handleApproveLog = (logId: string) => {
    console.log('Approving log:', logId);
    // In real app, this would make an API call
  };

  const handleRejectLog = (logId: string) => {
    console.log('Rejecting log:', logId);
    // In real app, this would make an API call
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="My Teams"
          value={myTeams.length}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Pending Logs"
          value={pendingLogs.length}
          icon={FileText}
          color="yellow"
        />
        <StatsCard
          title="Evaluations Due"
          value={2}
          icon={Star}
          color="red"
        />
        <StatsCard
          title="This Week's Logs"
          value={3}
          icon={Calendar}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Pending Approvals</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingLogs.map(log => (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{log.title}</h4>
                    <Badge variant="warning">Week {log.week}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{log.description}</p>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApproveLog(log.id)}
                      variant="primary"
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRejectLog(log.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Team Alpha submitted Week 3 log</p>
              <p className="text-sm text-gray-600">Team Beta uploaded project proposal</p>
              <p className="text-sm text-gray-600">Mid-term evaluation scheduled</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">My Teams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myTeams.map(team => (
          <TeamCard
            key={team.id}
            team={team}
            onClick={setSelectedTeam}
          />
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'teams':
        return renderTeams();
      case 'logs':
        return <div>Weekly logs view coming soon...</div>;
      case 'evaluations':
        return <div>Evaluations view coming soon...</div>;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-gray-200">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'teams', label: 'My Teams' },
          { key: 'logs', label: 'Weekly Logs' },
          { key: 'evaluations', label: 'Evaluations' }
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
          userRole="guide"
        />
      )}
    </div>
  );
};