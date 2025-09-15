const express = require('express');
const Evaluation = require('../models/Evaluation.cjs');
const Student = require('../models/Student.cjs');
const Guide = require('../models/Guide.cjs');
const { auth, authorize } = require('../middleware/auth.cjs');

const router = express.Router();

// Get evaluations
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      if (guide) {
        query = { evaluator: guide._id };
      }
    } else if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (student && student.team) {
        query = { team: student.team };
      }
    }

    const evaluations = await Evaluation.find(query)
      .populate('team', 'name projectTitle')
      .populate({
        path: 'evaluator',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ evaluationDate: -1 });

    res.json(evaluations);
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get evaluation by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('team', 'name projectTitle members')
      .populate({
        path: 'evaluator',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check permissions
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.team?.toString() !== evaluation.team._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      if (!guide || evaluation.evaluator._id.toString() !== guide._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Get evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create evaluation (Guides only)
router.post('/', auth, authorize('guide'), async (req, res) => {
  try {
    const { teamId, type, scores, feedback, suggestions } = req.body;

    // Get guide profile
    const guide = await Guide.findOne({ user: req.user._id });
    if (!guide) {
      return res.status(404).json({ message: 'Guide profile not found' });
    }

    // Verify guide is assigned to this team
    const Team = require('../models/Team.cjs');
    const team = await Team.findById(teamId);
    if (!team || team.guide?.toString() !== guide._id.toString()) {
      return res.status(403).json({ message: 'You can only evaluate your assigned teams' });
    }

    // Check if evaluation already exists for this type and team
    const existingEvaluation = await Evaluation.findOne({ 
      team: teamId, 
      type, 
      evaluator: guide._id 
    });
    
    if (existingEvaluation) {
      return res.status(400).json({ 
        message: `${type.replace('_', ' ')} evaluation already exists for this team` 
      });
    }

    // Validate scores
    const scoreFields = ['technical', 'innovation', 'implementation', 'presentation', 'teamwork'];
    for (const field of scoreFields) {
      if (!scores[field] || scores[field] < 0 || scores[field] > 100) {
        return res.status(400).json({ 
          message: `Invalid score for ${field}. Must be between 0 and 100.` 
        });
      }
    }

    // Create evaluation
    const evaluation = new Evaluation({
      team: teamId,
      evaluator: guide._id,
      type,
      scores,
      feedback,
      suggestions
    });

    await evaluation.save();
    await evaluation.populate([
      { path: 'team', select: 'name projectTitle' },
      {
        path: 'evaluator',
        populate: {
          path: 'user',
          select: 'name email'
        }
      }
    ]);

    res.status(201).json({
      message: 'Evaluation created successfully',
      evaluation
    });
  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update evaluation (Guides only, within 24 hours)
router.put('/:id', auth, authorize('guide'), async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Get guide profile
    const guide = await Guide.findOne({ user: req.user._id });
    if (!guide || evaluation.evaluator.toString() !== guide._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own evaluations' });
    }

    // Check if evaluation is within 24 hours
    const hoursSinceEvaluation = (Date.now() - evaluation.evaluationDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceEvaluation > 24) {
      return res.status(400).json({ 
        message: 'Evaluations can only be updated within 24 hours of creation' 
      });
    }

    const updates = req.body;
    
    // Validate scores if provided
    if (updates.scores) {
      const scoreFields = ['technical', 'innovation', 'implementation', 'presentation', 'teamwork'];
      for (const field of scoreFields) {
        if (updates.scores[field] !== undefined && 
            (updates.scores[field] < 0 || updates.scores[field] > 100)) {
          return res.status(400).json({ 
            message: `Invalid score for ${field}. Must be between 0 and 100.` 
          });
        }
      }
    }

    const allowedUpdates = ['scores', 'feedback', 'suggestions'];
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        evaluation[key] = updates[key];
      }
    });

    await evaluation.save();
    await evaluation.populate([
      { path: 'team', select: 'name projectTitle' },
      {
        path: 'evaluator',
        populate: {
          path: 'user',
          select: 'name email'
        }
      }
    ]);

    res.json({
      message: 'Evaluation updated successfully',
      evaluation
    });
  } catch (error) {
    console.error('Update evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete evaluation (Principal only)
router.delete('/:id', auth, authorize('principal'), async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    await Evaluation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team evaluation summary
router.get('/team/:teamId/summary', auth, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Check permissions
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.team?.toString() !== teamId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      const Team = require('../models/Team.cjs');
      const team = await Team.findById(teamId);
      if (!guide || team.guide?.toString() !== guide._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const evaluations = await Evaluation.find({ team: teamId })
      .populate({
        path: 'evaluator',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ evaluationDate: -1 });

    // Calculate averages
    const summary = {
      totalEvaluations: evaluations.length,
      averageScores: {
        technical: 0,
        innovation: 0,
        implementation: 0,
        presentation: 0,
        teamwork: 0,
        overall: 0
      },
      gradeDistribution: {},
      evaluationsByType: {},
      latestEvaluation: evaluations[0] || null
    };

    if (evaluations.length > 0) {
      const totals = evaluations.reduce((acc, eval) => {
        acc.technical += eval.scores.technical;
        acc.innovation += eval.scores.innovation;
        acc.implementation += eval.scores.implementation;
        acc.presentation += eval.scores.presentation;
        acc.teamwork += eval.scores.teamwork;
        acc.overall += eval.totalScore;
        return acc;
      }, { technical: 0, innovation: 0, implementation: 0, presentation: 0, teamwork: 0, overall: 0 });

      Object.keys(totals).forEach(key => {
        summary.averageScores[key] = totals[key] / evaluations.length;
      });

      // Grade distribution
      evaluations.forEach(eval => {
        summary.gradeDistribution[eval.grade] = (summary.gradeDistribution[eval.grade] || 0) + 1;
      });

      // Evaluations by type
      evaluations.forEach(eval => {
        summary.evaluationsByType[eval.type] = (summary.evaluationsByType[eval.type] || 0) + 1;
      });
    }

    res.json({
      summary,
      evaluations
    });
  } catch (error) {
    console.error('Get evaluation summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;