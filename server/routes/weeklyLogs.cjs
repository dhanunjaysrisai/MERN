const express = require('express');
const WeeklyLog = require('../models/WeeklyLog.cjs');
const Student = require('../models/Student.cjs');
const Guide = require('../models/Guide.cjs');
const upload = require('../middleware/upload.cjs');
const { auth, authorize } = require('../middleware/auth.cjs');

const router = express.Router();

// Get weekly logs
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      if (guide) {
        const Team = require('../models/Team.cjs');
        const teams = await Team.find({ guide: guide._id });
        query = { team: { $in: teams.map(t => t._id) } };
      }
    } else if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (student && student.team) {
        query = { team: student.team };
      }
    }

    const logs = await WeeklyLog.find(query)
      .populate('team', 'name projectTitle')
      .populate('submittedBy', 'user')
      .populate({
        path: 'submittedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('approvedBy', 'user')
      .sort({ week: -1, createdAt: -1 });

    res.json(logs);
  } catch (error) {
    console.error('Get weekly logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get weekly log by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const log = await WeeklyLog.findById(req.params.id)
      .populate('team', 'name projectTitle members')
      .populate({
        path: 'submittedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate({
        path: 'approvedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!log) {
      return res.status(404).json({ message: 'Weekly log not found' });
    }

    // Check permissions
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.team?.toString() !== log.team._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      const Team = require('../models/Team.cjs');
      const team = await Team.findById(log.team._id);
      if (!guide || team.guide?.toString() !== guide._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(log);
  } catch (error) {
    console.error('Get weekly log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create weekly log (Students/Team leads only)
router.post('/', auth, authorize('student', 'team_lead'), upload.array('attachments', 5), async (req, res) => {
  try {
    const { teamId, week, title, description, completedTasks, nextWeekPlans, challenges } = req.body;

    // Get student profile
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Verify student belongs to the team
    if (student.team?.toString() !== teamId) {
      return res.status(403).json({ message: 'You can only submit logs for your own team' });
    }

    // Check if log already exists for this week
    const existingLog = await WeeklyLog.findOne({ team: teamId, week });
    if (existingLog) {
      return res.status(400).json({ message: 'Weekly log already exists for this week' });
    }

    // Process attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Create weekly log
    const weeklyLog = new WeeklyLog({
      team: teamId,
      week: parseInt(week),
      title,
      description,
      completedTasks: Array.isArray(completedTasks) ? completedTasks : completedTasks.split('\n').filter(t => t.trim()),
      nextWeekPlans: Array.isArray(nextWeekPlans) ? nextWeekPlans : nextWeekPlans.split('\n').filter(p => p.trim()),
      challenges: Array.isArray(challenges) ? challenges : challenges.split('\n').filter(c => c.trim()),
      submittedBy: student._id,
      attachments
    });

    await weeklyLog.save();
    await weeklyLog.populate([
      { path: 'team', select: 'name projectTitle' },
      {
        path: 'submittedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      }
    ]);

    res.status(201).json({
      message: 'Weekly log submitted successfully',
      weeklyLog
    });
  } catch (error) {
    console.error('Create weekly log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update weekly log (Students/Team leads only, before approval)
router.put('/:id', auth, authorize('student', 'team_lead'), upload.array('attachments', 5), async (req, res) => {
  try {
    const log = await WeeklyLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Weekly log not found' });
    }

    // Check if already approved
    if (log.guideApproval) {
      return res.status(400).json({ message: 'Cannot update approved weekly log' });
    }

    // Get student profile
    const student = await Student.findOne({ user: req.user._id });
    if (!student || student.team?.toString() !== log.team.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    
    // Process arrays
    if (updates.completedTasks) {
      updates.completedTasks = Array.isArray(updates.completedTasks) 
        ? updates.completedTasks 
        : updates.completedTasks.split('\n').filter(t => t.trim());
    }
    if (updates.nextWeekPlans) {
      updates.nextWeekPlans = Array.isArray(updates.nextWeekPlans) 
        ? updates.nextWeekPlans 
        : updates.nextWeekPlans.split('\n').filter(p => p.trim());
    }
    if (updates.challenges) {
      updates.challenges = Array.isArray(updates.challenges) 
        ? updates.challenges 
        : updates.challenges.split('\n').filter(c => c.trim());
    }

    // Process new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));
      updates.attachments = [...(log.attachments || []), ...newAttachments];
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        log[key] = updates[key];
      }
    });

    await log.save();
    await log.populate([
      { path: 'team', select: 'name projectTitle' },
      {
        path: 'submittedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      }
    ]);

    res.json({
      message: 'Weekly log updated successfully',
      weeklyLog: log
    });
  } catch (error) {
    console.error('Update weekly log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject weekly log (Guides only)
router.put('/:id/approval', auth, authorize('guide'), async (req, res) => {
  try {
    const { approved, feedback } = req.body;
    
    const log = await WeeklyLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Weekly log not found' });
    }

    // Verify guide has permission for this team
    const guide = await Guide.findOne({ user: req.user._id });
    const Team = require('../models/Team.cjs');
    const team = await Team.findById(log.team);
    
    if (!guide || team.guide?.toString() !== guide._id.toString()) {
      return res.status(403).json({ message: 'You can only approve logs for your assigned teams' });
    }

    log.guideApproval = approved;
    log.guideFeedback = feedback || null;
    log.approvedBy = guide._id;
    log.approvedAt = approved ? new Date() : null;

    await log.save();
    await log.populate([
      { path: 'team', select: 'name projectTitle' },
      {
        path: 'submittedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      },
      {
        path: 'approvedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      }
    ]);

    res.json({
      message: `Weekly log ${approved ? 'approved' : 'rejected'} successfully`,
      weeklyLog: log
    });
  } catch (error) {
    console.error('Approve weekly log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete weekly log
router.delete('/:id', auth, async (req, res) => {
  try {
    const log = await WeeklyLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Weekly log not found' });
    }

    // Check permissions
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.team?.toString() !== log.team.toString() || log.guideApproval) {
        return res.status(403).json({ message: 'Cannot delete approved logs or logs from other teams' });
      }
    } else if (req.user.role !== 'principal') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await WeeklyLog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Weekly log deleted successfully' });
  } catch (error) {
    console.error('Delete weekly log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;