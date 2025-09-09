import React from 'react';
import { Users, Star, Calendar } from 'lucide-react';
import { Team } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface TeamCardProps {
  team: Team;
  onClick: (team: Team) => void;
  showDetailsButton?: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onClick, showDetailsButton = true }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'on_hold': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <Card hover className={showDetailsButton ? "cursor-pointer" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
          <Badge variant={getStatusColor(team.status)}>
            {team.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">{team.projectTitle}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {team.members.length} members
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Avg: {team.averagePercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {team.weeklyLogs.length} logs submitted
            </span>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Team Members:</p>
            <div className="flex flex-wrap gap-1">
              {team.members.slice(0, 3).map((member) => (
                <span key={member.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {member.name}
                  {member.isTeamLead && <span className="text-blue-600 ml-1">★</span>}
                </span>
              ))}
              {team.members.length > 3 && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  +{team.members.length - 3} more
                </span>
              )}
            </div>
          </div>
          
          {showDetailsButton && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(team);
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                View Team Details →
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};