import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Upload, BarChart3, Plus } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { TeamDetailsModal } from '../components/teams/TeamDetailsModal';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { WeeklyLogForm } from '../components/weekly-logs/WeeklyLogForm';
import { DocumentUpload } from '../components/documents/DocumentUpload';
import { db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'overview' | 'team' | 'logs' | 'documents'>('overview');
  const [showLogForm, setShowLogForm] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.profile?.team_id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.profile?.team_id) return;

    setLoading(true);
    try {
      const [teamsData, logsData, documentsData] = await Promise.all([
        db.getTeams(),
        db.getWeeklyLogs(user.profile.team_id),
        db.getDocuments(user.profile.team_id)
      ]);

      if (teamsData.data) {
        const team = teamsData.data.find(t => t.id === user.profile.team_id);
        setMyTeam(team);
      }
      if (logsData.data) setWeeklyLogs(logsData.data);
      if (documentsData.data) setDocuments(documentsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLog = (logData: any) => {
    setWeeklyLogs([...weeklyLogs, logData]);
    setShowLogForm(false);
    loadData(); // Refresh data
  };

  const handleUploadDocument = (documentData: any) => {
    setDocuments([...documents, documentData]);
    setShowDocumentUpload(false);
    loadData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Team Assigned</h2>
        <p className="text-gray-600">You haven't been assigned to a team yet. Please contact your administrator.</p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Team Members"
          value={myTeam.members?.length || 0}
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
          value={documents.length}
          icon={Upload}
          color="yellow"
        />
        <StatsCard
          title="Team Average"
          value={`${myTeam.average_percentage?.toFixed(1) || 0}%`}
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
                <p className="font-medium">{myTeam.project_title}</p>
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
                      style={{ width: `${myTeam.average_percentage || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{myTeam.average_percentage?.toFixed(1) || 0}%</span>
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
              onClick={() => setShowDocumentUpload(true)}
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
          <p className="text-gray-600">{myTeam.project_title}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTeam.members?.map((member: any) => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{member.profiles?.full_name}</h4>
                  {member.is_team_lead && <Badge variant="primary">Team Lead</Badge>}
                </div>
                <p className="text-sm text-gray-600">{member.roll_number}</p>
                <p className="text-sm text-gray-600">{member.percentage}%</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {member.skills.map(skill => (
                    <span key={skill} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )) || []}
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

      {showDocumentUpload && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Upload Document</h3>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              teamId={myTeam.id}
              onUpload={handleUploadDocument}
              onCancel={() => setShowDocumentUpload(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {weeklyLogs.map(log => (
          <Card key={log.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Week {log.week_number}: {log.title}</h3>
                <Badge variant={log.guide_approval ? 'success' : 'warning'}>
                  {log.guide_approval ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{log.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Completed Tasks</h4>
                  <ul className="text-sm space-y-1">
                    {log.completed_tasks?.map((task: string, index: number) => (
                      <li key={index}>• {task}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Next Week Plans</h4>
                  <ul className="text-sm space-y-1">
                    {log.next_week_plans?.map((plan: string, index: number) => (
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
              {log.guide_feedback && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Guide Feedback</h4>
                  <p className="text-blue-800 text-sm">{log.guide_feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Documents</h2>
        <Button onClick={() => setShowDocumentUpload(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {showDocumentUpload && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Upload New Document</h3>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              teamId={myTeam.id}
              onUpload={handleUploadDocument}
              onCancel={() => setShowDocumentUpload(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{doc.name}</h4>
                <Badge variant="secondary">{doc.type}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Uploaded by {doc.uploaded_by_student?.profiles?.full_name}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
              {doc.description && (
                <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
              )}
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                <span>v{doc.version}</span>
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
        return renderDocuments();
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
          userRole={user?.role || 'student'}
        />
      )}
    </div>
  );
};