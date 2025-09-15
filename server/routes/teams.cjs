const express = require('express');
const Team = require('../models/Team.cjs');
const Student = require('../models/Student.cjs');
const Guide = require('../models/Guide.cjs');
const { auth, authorize } = require('../middleware/auth.cjs');

const router = express.Router();

// Get all teams
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      if (guide) {
        query = { guide: guide._id };
      }
    } else if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (student && student.team) {
        query = { _id: student.team };
      }
    }

    const teams = await Team.find(query)
      .populate({
        path: 'members',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate({
        path: 'teamLead',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate({
        path: 'guide',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate({
        path: 'members',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate({
        path: 'teamLead',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate({
        path: 'guide',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check permissions
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.team?.toString() !== team._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      if (!guide || team.guide?.toString() !== guide._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create team (Principal only)
router.post('/', auth, authorize('principal'), async (req, res) => {
  try {
    const { name, members, teamLeadId, projectTitle, projectDescription, domain, technologies } = req.body;

    // Validate team lead is in members
    if (!members.includes(teamLeadId)) {
      return res.status(400).json({ message: 'Team lead must be a member of the team' });
    }

    // Check if students are already in other teams
    const existingAssignments = await Student.find({
      _id: { $in: members },
      team: { $ne: null }
    });

    if (existingAssignments.length > 0) {
      return res.status(400).json({ 
        message: 'Some students are already assigned to other teams' 
      });
    }

    // Create team
    const team = new Team({
      name,
      members,
      teamLead: teamLeadId,
      projectTitle,
      projectDescription,
      domain,
      technologies: technologies || []
    });

    await team.save();

    // Update students with team assignment
    await Student.updateMany(
      { _id: { $in: members } },
      { team: team._id }
    );

    // Set team lead flag
    await Student.findByIdAndUpdate(teamLeadId, { isTeamLead: true });

    // Populate team data
    await team.populate([
      {
        path: 'members',
        populate: { path: 'user', select: 'name email' }
      },
      {
        path: 'teamLead',
        populate: { path: 'user', select: 'name email' }
      }
    ]);

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update team
router.put('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check permissions
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.team?.toString() !== team._id.toString() || !student.isTeamLead) {
        return res.status(403).json({ message: 'Only team leads can update team details' });
      }
    } else if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      if (!guide || team.guide?.toString() !== guide._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role !== 'principal') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        team[key] = updates[key];
      }
    });

    await team.save();
    await team.populate([
      {
        path: 'members',
        populate: { path: 'user', select: 'name email' }
      },
      {
        path: 'teamLead',
        populate: { path: 'user', select: 'name email' }
      },
      {
        path: 'guide',
        populate: { path: 'user', select: 'name email' }
      }
    ]);

    res.json({
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign guide to team (Principal only)
router.put('/:id/assign-guide', auth, authorize('principal'), async (req, res) => {
  try {
    const { guideId } = req.body;
    
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Check if guide has capacity
    if (guide.currentTeams >= guide.maxTeams) {
      return res.status(400).json({ message: 'Guide has reached maximum team capacity' });
    }

    // Remove from previous guide if assigned
    if (team.guide) {
      await Guide.findByIdAndUpdate(
        team.guide,
        { 
          $pull: { assignedTeams: team._id },
          $inc: { currentTeams: -1 }
        }
      );
    }

    // Assign new guide
    team.guide = guideId;
    await team.save();

    // Update guide
    await Guide.findByIdAndUpdate(
      guideId,
      { 
        $addToSet: { assignedTeams: team._id },
        $inc: { currentTeams: 1 }
      }
    );

    await team.populate([
      {
        path: 'guide',
        populate: { path: 'user', select: 'name email' }
      }
    ]);

    res.json({
      message: 'Guide assigned successfully',
      team
    });
  } catch (error) {
    console.error('Assign guide error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete team (Principal only)
router.delete('/:id', auth, authorize('principal'), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Remove team assignment from students
    await Student.updateMany(
      { team: team._id },
      { $unset: { team: 1 }, isTeamLead: false }
    );

    // Remove team from guide
    if (team.guide) {
      await Guide.findByIdAndUpdate(
        team.guide,
        { 
          $pull: { assignedTeams: team._id },
          $inc: { currentTeams: -1 }
        }
      );
    }

    await Team.findByIdAndDelete(req.params.id);

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;