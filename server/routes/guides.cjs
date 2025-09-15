const express = require('express');
const Guide = require('../models/Guide.cjs');
const User = require('../models/User.cjs');
const { auth, authorize } = require('../middleware/auth.cjs');

const router = express.Router();

// Get all guides
router.get('/', auth, async (req, res) => {
  try {
    const guides = await Guide.find()
      .populate('user', 'name email')
      .populate('assignedTeams', 'name projectTitle')
      .sort({ createdAt: -1 });

    res.json(guides);
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get guide by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTeams', 'name projectTitle members averagePercentage');

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    res.json(guide);
  } catch (error) {
    console.error('Get guide error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create guide (Principal only)
router.post('/', auth, authorize('principal'), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      department, 
      expertise, 
      maxTeams, 
      qualification, 
      experience 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: 'guide'
    });
    await user.save();

    // Create guide profile
    const guide = new Guide({
      user: user._id,
      department,
      expertise: expertise || [],
      maxTeams: maxTeams || 3,
      qualification,
      experience
    });
    await guide.save();

    // Populate user data for response
    await guide.populate('user', 'name email');

    res.status(201).json({
      message: 'Guide created successfully',
      guide
    });
  } catch (error) {
    console.error('Create guide error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update guide
router.put('/:id', auth, async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Check permissions
    if (req.user.role !== 'principal' && 
        guide.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        guide[key] = updates[key];
      }
    });

    await guide.save();
    await guide.populate('user', 'name email');
    await guide.populate('assignedTeams', 'name projectTitle');

    res.json({
      message: 'Guide updated successfully',
      guide
    });
  } catch (error) {
    console.error('Update guide error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete guide (Principal only)
router.delete('/:id', auth, authorize('principal'), async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Remove guide from assigned teams
    if (guide.assignedTeams.length > 0) {
      const Team = require('../models/Team.cjs');
      await Team.updateMany(
        { _id: { $in: guide.assignedTeams } },
        { $unset: { guide: 1 } }
      );
    }

    // Delete guide and associated user
    await Guide.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(guide.user);

    res.json({ message: 'Guide deleted successfully' });
  } catch (error) {
    console.error('Delete guide error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available guides (guides with capacity)
router.get('/available/list', auth, authorize('principal'), async (req, res) => {
  try {
    const guides = await Guide.find({
      $expr: { $lt: ['$currentTeams', '$maxTeams'] }
    })
      .populate('user', 'name email')
      .sort({ currentTeams: 1 });

    res.json(guides);
  } catch (error) {
    console.error('Get available guides error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get guide's teams (Guide only)
router.get('/my/teams', auth, authorize('guide'), async (req, res) => {
  try {
    const guide = await Guide.findOne({ user: req.user._id })
      .populate({
        path: 'assignedTeams',
        populate: {
          path: 'members teamLead',
          populate: {
            path: 'user',
            select: 'name email'
          }
        }
      });

    if (!guide) {
      return res.status(404).json({ message: 'Guide profile not found' });
    }

    res.json(guide.assignedTeams);
  } catch (error) {
    console.error('Get guide teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;