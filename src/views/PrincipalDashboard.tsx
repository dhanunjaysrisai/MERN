import React, { useState } from 'react';
import { Users, BookOpen, BarChart3, Plus, Zap, UserCheck } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { StudentForm } from '../components/students/StudentForm';
import { GuideForm } from '../components/guides/GuideForm';
import { TeamCard } from '../components/teams/TeamCard';
import { TeamDetailsModal } from '../components/teams/TeamDetailsModal';
import { Student, Team, Guide } from '../types';
import { createBalancedTeams, calculateTeamStats } from '../utils/teamFormation';
import { assignGuidesToTeams, calculateGuideStats } from '../utils/guideAssignment';

export const PrincipalDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'students' | 'teams' | 'guides' | 'analytics'>('overview');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [guideAssignments, setGuideAssignments] = useState<{ teamId: string; guideId: string }[]>([]);

  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    // Ensure students with backlogs have 0 percentage
    const normalizedData = {
      ...studentData,
      percentage: studentData.backlogs > 0 ? 0 : studentData.percentage
    };
    
    const newStudent: Student = {
      ...normalizedData,
      id: `student-${Date.now()}`
    };
    setStudents([...students, newStudent]);
    setShowStudentForm(false);
  };

  const handleAddGuide = (guideData: Omit<Guide, 'id' | 'currentTeams' | 'assignedTeamIds'>) => {
    const newGuide: Guide = {
      ...guideData,
      id: `guide-${Date.now()}`,
      currentTeams: 0,
      assignedTeamIds: []
    };
    setGuides([...guides, newGuide]);
    setShowGuideForm(false);
  };

  const handleCreateTeams = () => {
    const result = createBalancedTeams(students);
    setTeams(result.teams);
    
    // Update students with team assignments
    const updatedStudents = students.map(student => {
      const assignedTeam = result.teams.find(team => 
        team.members.some(member => member.id === student.id)
      );
      return assignedTeam 
        ? { ...student, teamId: assignedTeam.id }
        : student;
    });
    setStudents(updatedStudents);
    
    // Auto-assign guides if available
    if (guides.length > 0) {
      handleAssignGuides(result.teams);
    }
  };

  const handleAssignGuides = (teamsToAssign = teams) => {
    const result = assignGuidesToTeams(teamsToAssign, guides);
    setGuideAssignments(result.assignments);
    
    // Update teams with guide assignments
    const updatedTeams = teamsToAssign.map(team => {
      const assignment = result.assignments.find(a => a.teamId === team.id);
      return assignment ? { ...team, guideId: assignment.guideId } : team;
    });
    setTeams(updatedTeams);
    
    // Update guides with current team counts
    const updatedGuides = guides.map(guide => {
      const assignedTeams = result.assignments.filter(a => a.guideId === guide.id);
      return {
        ...guide,
        currentTeams: assignedTeams.length,
        assignedTeamIds: assignedTeams.map(a => a.teamId)
      };
    });
    setGuides(updatedGuides);
  };

  const stats = calculateTeamStats(teams);
  const guideStats = calculateGuideStats(guides, guideAssignments);

  const getTeamGuide = (teamId: string): Guide | undefined => {
    const assignment = guideAssignments.find(a => a.teamId === teamId);
    return assignment ? guides.find(g => g.id === assignment.guideId) : undefined;
  };

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
          value={stats.averageTeamPercentage ? `${stats.averageTeamPercentage.toFixed(1)}%` : '0%'}
          icon={BarChart3}
          color="red"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Team Balance Score"
          value={stats.teamBalanceScore ? `${stats.teamBalanceScore.toFixed(0)}%` : '100%'}
          icon={BarChart3}
          color="green"
        />
        <StatsCard
          title="Guide Utilization"
          value={`${guideStats.utilizationRate.toFixed(1)}%`}
          icon={UserCheck}
          color="blue"
        />
        <StatsCard
          title="Guide Balance"
          value={`${guideStats.balanceScore.toFixed(0)}%`}
          icon={BarChart3}
          color="yellow"
        />
        <StatsCard
          title="Unassigned Students"
          value={students.filter(s => !s.teamId).length}
          icon={Users}
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
            {teams.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Balance Score</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${stats.teamBalanceScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{stats.teamBalanceScore.toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guide Utilization</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${guideStats.utilizationRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{guideStats.utilizationRate.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>• Teams are balanced within {((100 - stats.teamBalanceScore) / 2).toFixed(1)}% range</p>
                  <p>• {guideStats.totalAssigned} teams assigned to {guideStats.totalGuides} guides</p>
                  <p>• Students with backlogs: 0% performance</p>
                </div>
              </div>
            ) : (
            <div className="space-y-2">
                <p className="text-sm text-gray-600">No teams created yet</p>
                <p className="text-xs text-gray-500">Add at least 4 students to create teams</p>
            </div>
            )}
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
                <h4 className="font-semibold">{student.name}</h4>
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
                {student.teamId && (
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
                <h4 className="font-semibold">{guide.name}</h4>
                <span className="text-sm text-gray-500">
                  {guide.currentTeams}/{guide.maxTeams} teams
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{guide.email}</p>
              <p className="text-sm text-gray-600 mb-3 capitalize">
                {guide.department.replace('-', ' ')}
              </p>
              
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Utilization:</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(guide.currentTeams / guide.maxTeams) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {((guide.currentTeams / guide.maxTeams) * 100).toFixed(0)}%
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
          guide={getTeamGuide(selectedTeam.id)}
          onClose={() => setSelectedTeam(null)}
          userRole="principal"
        />
      )}
    </div>
  );
};