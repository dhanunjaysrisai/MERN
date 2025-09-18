import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { Users, BookOpen, BarChart3, Plus, Zap, UserCheck } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { StudentForm } from '../components/students/StudentForm';
import { GuideForm } from '../components/guides/GuideForm';
import { TeamCard } from '../components/teams/TeamCard';
import { TeamDetailsModal } from '../components/teams/TeamDetailsModal';
import { db } from '../lib/supabase';

export const PrincipalDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'students' | 'teams' | 'guides' | 'analytics'>('overview');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsData, teamsData, guidesData] = await Promise.all([
        db.getStudents(),
        db.getTeams(),
        db.getGuides()
      ]);

      if (studentsData.data) setStudents(studentsData.data);
      if (teamsData.data) setTeams(teamsData.data);
      if (guidesData.data) setGuides(guidesData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = (studentData: any) => {
    setStudents([...students, studentData]);
    setShowStudentForm(false);
    loadData(); // Refresh data
  };

  const handleAddGuide = (guideData: any) => {
    setGuides([...guides, guideData]);
    setShowGuideForm(false);
    loadData(); // Refresh data
  };

  const handleCreateTeams = async () => {
    // This would implement team creation logic
    // For now, just refresh data
    await loadData();
  };

  const handleAssignGuides = async () => {
    // This would implement guide assignment logic
    // For now, just refresh data
    await loadData();
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

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Students"
          value={students.length}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Project Guides"
          value={guides.length}
          icon={UserCheck}
          color="green"
        />
        <StatsCard
          title="Active Teams"
          value={teams.length}
          icon={BookOpen}
          color="yellow"
        />
        <StatsCard
          title="Avg Team Performance"
          value="0%"
          icon={BarChart3}
          color="red"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => setShowStudentForm(true)}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Student
            </Button>
            <Button 
              onClick={() => setShowGuideForm(true)}
              className="w-full justify-start"
              variant="outline"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Add Project Guide
            </Button>
            <Button 
              onClick={handleCreateTeams}
              className="w-full justify-start"
              disabled={students.length < 4}
            >
              <Zap className="w-4 h-4 mr-2" />
              Create AI Teams
            </Button>
            <Button 
              onClick={() => handleAssignGuides()}
              className="w-full justify-start"
              disabled={teams.length === 0 || guides.length === 0}
              variant="secondary"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Assign Guides
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">System Status</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">System is running smoothly</p>
              <p className="text-xs text-gray-500">All services are operational</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Students Management</h2>
        <Button onClick={() => setShowStudentForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {showStudentForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Add New Student</h3>
          </CardHeader>
          <CardContent>
            <StudentForm
              onSubmit={handleAddStudent}
              onCancel={() => setShowStudentForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(student => (
          <Card key={student.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{student.profiles?.full_name}</h4>
                <span className="text-sm text-gray-500">{student.percentage}%</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{student.rollNumber}</p>
              <p className="text-sm text-gray-600 mb-2">{student.domain}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {student.backlogs} backlogs
                </span>
                {student.backlogs > 0 && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Performance: 0%
                  </span>
                )}
                {student.team_id && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Team Assigned
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Teams Management</h2>
        <div className="flex space-x-3">
          <Button onClick={handleCreateTeams} disabled={students.length < 4}>
            <Zap className="w-4 h-4 mr-2" />
            Create AI Teams
          </Button>
          <Button 
            onClick={() => handleAssignGuides()}
            disabled={teams.length === 0 || guides.length === 0}
            variant="secondary"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Assign Guides
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <TeamCard
            key={team.id}
            team={team}
            onClick={setSelectedTeam}
          />
        ))}
      </div>
    </div>
  );

  const renderGuides = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Project Guides Management</h2>
        <Button onClick={() => setShowGuideForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Guide
        </Button>
      </div>

      {showGuideForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Add New Project Guide</h3>
          </CardHeader>
          <CardContent>
            <GuideForm
              onSubmit={handleAddGuide}
              onCancel={() => setShowGuideForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map(guide => (
          <Card key={guide.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{guide.profiles?.full_name}</h4>
                <span className="text-sm text-gray-500">
                  {guide.current_teams}/{guide.max_teams} teams
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{guide.profiles?.email}</p>
              <p className="text-sm text-gray-600 mb-3 capitalize">
                {guide.department.replace('-', ' ')}
              </p>
              
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Utilization:</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(guide.current_teams / guide.max_teams) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {((guide.current_teams / guide.max_teams) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Expertise:</p>
                <div className="flex flex-wrap gap-1">
                  {guide.expertise.slice(0, 3).map((skill, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                  {guide.expertise.length > 3 && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      +{guide.expertise.length - 3} more
                    </span>
                  )}
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
      case 'students':
        return renderStudents();
      case 'teams':
        return renderTeams();
      case 'guides':
        return renderGuides();
      case 'analytics':
        return <div>Analytics view coming soon...</div>;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-gray-200">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'students', label: 'Students' },
          { key: 'teams', label: 'Teams' },
          { key: 'guides', label: 'Project Guides' },
          { key: 'analytics', label: 'Analytics' }
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
          guide={selectedTeam.guide}
          onClose={() => setSelectedTeam(null)}
          userRole="principal"
        />
      )}
    </div>
  );
};