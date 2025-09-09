import React from 'react';
import { X, Mail, Award, Users, BookOpen } from 'lucide-react';
import { Team, Guide } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TeamDetailsModalProps {
  team: Team;
  guide?: Guide;
  onClose: () => void;
  userRole: 'principal' | 'guide' | 'team_lead' | 'student';
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ 
  team, 
  guide, 
  onClose, 
  userRole 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
            <p className="text-gray-600 mt-1">{team.projectTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Team Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Team Size</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1">{team.members.length}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Avg Performance</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">{team.averagePercentage.toFixed(1)}%</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Domain</span>
              </div>
              <p className="text-lg font-semibold text-purple-600 mt-1 capitalize">
                {team.domain.replace('-', ' ')}
              </p>
            </div>
          </div>

          {/* Project Guide */}
          {guide && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Project Guide</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{guide.name}</p>
                  <p className="text-sm text-gray-600">{guide.email}</p>
                  <p className="text-sm text-gray-500 capitalize">{guide.department.replace('-', ' ')}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Expertise:</p>
                <div className="flex flex-wrap gap-1">
                  {guide.expertise.map((skill, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Team Members */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Team Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.members.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-gray-600">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.rollNumber}</p>
                      </div>
                    </div>
                    {member.isTeamLead && (
                      <Badge variant="primary">Team Lead</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{member.email}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Performance:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{member.percentage}%</span>
                        {member.backlogs > 0 && (
                          <Badge variant="danger">{member.backlogs} backlogs</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.map((skill, index) => (
                          <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Progress */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Project Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{team.weeklyLogs.length}</p>
                <p className="text-sm text-blue-800">Weekly Logs</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{team.documents.length}</p>
                <p className="text-sm text-green-800">Documents</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{team.evaluations.length}</p>
                <p className="text-sm text-purple-800">Evaluations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};