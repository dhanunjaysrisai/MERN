import { Team, Guide } from '../types';

interface GuideAssignmentResult {
  assignments: { teamId: string; guideId: string }[];
  unassignedTeams: Team[];
  guideWorkload: { [guideId: string]: number };
}

export const assignGuidesToTeams = (teams: Team[], guides: Guide[]): GuideAssignmentResult => {
  if (guides.length === 0) {
    return {
      assignments: [],
      unassignedTeams: teams,
      guideWorkload: {}
    };
  }

  const assignments: { teamId: string; guideId: string }[] = [];
  const unassignedTeams: Team[] = [];
  const guideWorkload: { [guideId: string]: number } = {};

  // Initialize guide workload
  guides.forEach(guide => {
    guideWorkload[guide.id] = 0;
  });

  // Group teams by domain for better matching
  const teamsByDomain = teams.reduce((groups, team) => {
    if (!groups[team.domain]) {
      groups[team.domain] = [];
    }
    groups[team.domain].push(team);
    return groups;
  }, {} as { [domain: string]: Team[] });

  // Sort guides by their current workload and expertise match
  const sortGuidesByAvailability = (domain: string) => {
    return [...guides].sort((a, b) => {
      // First priority: availability (lower current workload)
      const workloadDiff = guideWorkload[a.id] - guideWorkload[b.id];
      if (workloadDiff !== 0) return workloadDiff;

      // Second priority: expertise match
      const aExpertiseMatch = a.expertise.some(exp => 
        domain.toLowerCase().includes(exp.toLowerCase()) || 
        exp.toLowerCase().includes(domain.toLowerCase())
      );
      const bExpertiseMatch = b.expertise.some(exp => 
        domain.toLowerCase().includes(exp.toLowerCase()) || 
        exp.toLowerCase().includes(domain.toLowerCase())
      );

      if (aExpertiseMatch && !bExpertiseMatch) return -1;
      if (!aExpertiseMatch && bExpertiseMatch) return 1;

      // Third priority: maximum capacity
      return b.maxTeams - a.maxTeams;
    });
  };

  // Assign guides to teams
  Object.entries(teamsByDomain).forEach(([domain, domainTeams]) => {
    domainTeams.forEach(team => {
      const availableGuides = sortGuidesByAvailability(domain).filter(
        guide => guideWorkload[guide.id] < guide.maxTeams
      );

      if (availableGuides.length > 0) {
        const assignedGuide = availableGuides[0];
        assignments.push({ teamId: team.id, guideId: assignedGuide.id });
        guideWorkload[assignedGuide.id]++;
      } else {
        unassignedTeams.push(team);
      }
    });
  });

  return { assignments, unassignedTeams, guideWorkload };
};

export const calculateGuideStats = (guides: Guide[], assignments: { teamId: string; guideId: string }[]) => {
  const totalCapacity = guides.reduce((sum, guide) => sum + guide.maxTeams, 0);
  const totalAssigned = assignments.length;
  const utilizationRate = totalCapacity > 0 ? (totalAssigned / totalCapacity) * 100 : 0;

  const workloadDistribution = guides.map(guide => {
    const assignedTeams = assignments.filter(a => a.guideId === guide.id).length;
    return {
      guideId: guide.id,
      guideName: guide.name,
      assignedTeams,
      maxTeams: guide.maxTeams,
      utilizationRate: guide.maxTeams > 0 ? (assignedTeams / guide.maxTeams) * 100 : 0
    };
  });

  const balanceScore = calculateWorkloadBalance(workloadDistribution);

  return {
    totalGuides: guides.length,
    totalCapacity,
    totalAssigned,
    utilizationRate,
    workloadDistribution,
    balanceScore,
    unassignedTeams: guides.length > 0 ? Math.max(0, totalAssigned - totalCapacity) : 0
  };
};

const calculateWorkloadBalance = (workloadDistribution: any[]): number => {
  if (workloadDistribution.length === 0) return 100;

  const utilizationRates = workloadDistribution.map(w => w.utilizationRate);
  const maxRate = Math.max(...utilizationRates);
  const minRate = Math.min(...utilizationRates);
  const range = maxRate - minRate;

  // Perfect balance = 100%, larger range = lower score
  return Math.max(0, 100 - range);
};