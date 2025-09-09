export interface User {
  id: string;
  email: string;
  name: string;
  role: 'principal' | 'guide' | 'team_lead' | 'student';
  profileImage?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  percentage: number;
  domain: string;
  backlogs: number;
  skills: string[];
  teamId?: string;
  isTeamLead?: boolean;
}

export interface Team {
  id: string;
  name: string;
  members: Student[];
  teamLeadId: string;
  guideId: string;
  projectTitle: string;
  domain: string;
  averagePercentage: number;
  weeklyLogs: WeeklyLog[];
  documents: Document[];
  evaluations: Evaluation[];
  status: 'active' | 'completed' | 'on_hold';
}

export interface WeeklyLog {
  id: string;
  teamId: string;
  week: number;
  title: string;
  description: string;
  completedTasks: string[];
  nextWeekPlans: string[];
  challenges: string[];
  submittedBy: string;
  submittedAt: Date;
  guideApproval: boolean;
  guideFeedback?: string;
}

export interface Document {
  id: string;
  teamId: string;
  name: string;
  type: 'proposal' | 'report' | 'presentation' | 'code' | 'other';
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: number;
}

export interface Evaluation {
  id: string;
  teamId: string;
  evaluatorId: string;
  type: 'weekly' | 'mid_term' | 'final';
  scores: {
    technical: number;
    innovation: number;
    implementation: number;
    presentation: number;
    teamwork: number;
  };
  feedback: string;
  evaluatedAt: Date;
}

export interface Guide {
  id: string;
  name: string;
  email: string;
  department: string;
  expertise: string[];
  maxTeams: number;
  currentTeams: number;
  assignedTeamIds: string[];
}