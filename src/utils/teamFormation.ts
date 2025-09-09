import { Student, Team } from '../types';

interface TeamFormationResult {
  teams: Team[];
  unassignedStudents: Student[];
}

export const createBalancedTeams = (students: Student[]): TeamFormationResult => {
  // Normalize students: set percentage to 0 for those with backlogs
  const normalizedStudents = students.map(student => ({
    ...student,
    percentage: student.backlogs > 0 ? 0 : student.percentage
  }));

  // Sort students by normalized percentage (descending) for balanced distribution
  const sortedStudents = [...normalizedStudents].sort((a, b) => {
    return b.percentage - a.percentage;
  });

  const teams: Team[] = [];
  const unassignedStudents: Student[] = [];
  const teamSize = 4;
  const totalStudents = sortedStudents.length;
  const numberOfTeams = Math.floor(totalStudents / teamSize);

  if (numberOfTeams === 0) {
    return { teams: [], unassignedStudents: sortedStudents };
  }

  // Create empty teams
  for (let i = 0; i < numberOfTeams; i++) {
    teams.push({
      id: `team-${Date.now()}-${i}`,
      name: `Team ${String.fromCharCode(65 + i)}`, // Team A, Team B, etc.
      members: [],
      teamLeadId: '',
      guideId: '',
      projectTitle: '',
      domain: '',
      averagePercentage: 0,
      weeklyLogs: [],
      documents: [],
      evaluations: [],
      status: 'active'
    });
  }

  // Distribute students using round-robin to ensure balance
  let currentTeamIndex = 0;
  const studentsToAssign = sortedStudents.slice(0, numberOfTeams * teamSize);
  
  // First pass: distribute high performers
  for (let i = 0; i < studentsToAssign.length; i++) {
    const student = { ...studentsToAssign[i], teamId: teams[currentTeamIndex].id };
    teams[currentTeamIndex].members.push(student);
    
    // Move to next team in round-robin fashion
    currentTeamIndex = (currentTeamIndex + 1) % numberOfTeams;
  }

  // Second pass: balance teams by redistributing if needed
  balanceTeamPerformances(teams);

  // Assign team leads, domains, and project titles
  teams.forEach((team, index) => {
    // Select team lead (highest performing student without backlogs, or best overall)
    const eligibleLeads = team.members.filter(m => m.backlogs === 0);
    const teamLead = eligibleLeads.length > 0 
      ? eligibleLeads.reduce((best, current) => 
          current.percentage > best.percentage ? current : best
        )
      : team.members.reduce((best, current) => 
          current.percentage > best.percentage ? current : best
        );
    
    teamLead.isTeamLead = true;
    team.teamLeadId = teamLead.id;

    // Determine dominant domain
    const domainCounts = team.members.reduce((counts, member) => {
      counts[member.domain] = (counts[member.domain] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const dominantDomain = Object.entries(domainCounts)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    team.domain = dominantDomain;
    team.projectTitle = `${dominantDomain.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Project ${index + 1}`;

    // Calculate average percentage (using original percentages for display)
    const originalPercentages = team.members.map(member => {
      const originalStudent = students.find(s => s.id === member.id);
      return originalStudent?.percentage || 0;
    });
    team.averagePercentage = originalPercentages.reduce((sum, p) => sum + p, 0) / team.members.length;
  });

  // Add unassigned students
  unassignedStudents.push(...sortedStudents.slice(numberOfTeams * teamSize));

  return { teams, unassignedStudents };
};

const balanceTeamPerformances = (teams: Team[]) => {
  const maxIterations = 10;
  let iteration = 0;

  while (iteration < maxIterations) {
    const teamAverages = teams.map(team => ({
      team,
      average: team.members.reduce((sum, member) => sum + member.percentage, 0) / team.members.length
    }));

    // Find teams with highest and lowest averages
    const sortedByAverage = teamAverages.sort((a, b) => b.average - a.average);
    const highestTeam = sortedByAverage[0];
    const lowestTeam = sortedByAverage[sortedByAverage.length - 1];

    // If difference is small enough, we're balanced
    if (highestTeam.average - lowestTeam.average < 5) {
      break;
    }

    // Try to swap students to balance
    const swapped = attemptStudentSwap(highestTeam.team, lowestTeam.team);
    if (!swapped) {
      break; // No beneficial swap found
    }

    iteration++;
  }
};

const attemptStudentSwap = (highTeam: Team, lowTeam: Team): boolean => {
  // Find best swap candidates
  for (const highStudent of highTeam.members) {
    for (const lowStudent of lowTeam.members) {
      // Calculate current averages
      const highAvg = highTeam.members.reduce((sum, m) => sum + m.percentage, 0) / highTeam.members.length;
      const lowAvg = lowTeam.members.reduce((sum, m) => sum + m.percentage, 0) / lowTeam.members.length;

      // Calculate new averages after swap
      const newHighAvg = (highAvg * highTeam.members.length - highStudent.percentage + lowStudent.percentage) / highTeam.members.length;
      const newLowAvg = (lowAvg * lowTeam.members.length - lowStudent.percentage + highStudent.percentage) / lowTeam.members.length;

      // Check if swap improves balance
      const currentDiff = Math.abs(highAvg - lowAvg);
      const newDiff = Math.abs(newHighAvg - newLowAvg);

      if (newDiff < currentDiff) {
        // Perform the swap
        const highIndex = highTeam.members.findIndex(m => m.id === highStudent.id);
        const lowIndex = lowTeam.members.findIndex(m => m.id === lowStudent.id);

        // Update team IDs
        highStudent.teamId = lowTeam.id;
        lowStudent.teamId = highTeam.id;

        // Swap students
        highTeam.members[highIndex] = lowStudent;
        lowTeam.members[lowIndex] = highStudent;

        return true;
      }
    }
  }
  return false;
};

export const calculateTeamStats = (teams: Team[]) => {
  if (teams.length === 0) {
    return {
      totalTeams: 0,
      totalStudents: 0,
      averageTeamPercentage: 0,
      domainDistribution: {},
      backlogDistribution: {},
      teamBalanceScore: 100
    };
  }

  const totalStudents = teams.reduce((sum, team) => sum + team.members.length, 0);
  const averageTeamPercentage = teams.reduce((sum, team) => sum + team.averagePercentage, 0) / teams.length;
  
  const domainDistribution = teams.reduce((dist, team) => {
    dist[team.domain] = (dist[team.domain] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);

  const backlogDistribution = teams.reduce((dist, team) => {
    const teamBacklogs = team.members.reduce((sum, member) => sum + member.backlogs, 0);
    if (teamBacklogs === 0) dist.none = (dist.none || 0) + 1;
    else if (teamBacklogs <= 2) dist.low = (dist.low || 0) + 1;
    else if (teamBacklogs <= 5) dist.medium = (dist.medium || 0) + 1;
    else dist.high = (dist.high || 0) + 1;
    return dist;
  }, {} as Record<string, number>);

  // Calculate team balance score (100 = perfectly balanced)
  const teamAverages = teams.map(team => team.averagePercentage);
  const maxAvg = Math.max(...teamAverages);
  const minAvg = Math.min(...teamAverages);
  const balanceRange = maxAvg - minAvg;
  const teamBalanceScore = Math.max(0, 100 - (balanceRange * 2)); // Penalize large differences

  return {
    totalTeams: teams.length,
    totalStudents,
    averageTeamPercentage,
    domainDistribution,
    backlogDistribution,
    teamBalanceScore
  };
};