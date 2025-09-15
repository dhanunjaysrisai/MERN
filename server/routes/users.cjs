const express = require('express');
const User = require('../models/User.cjs');
const Student = require('../models/Student.cjs');
const Guide = require('../models/Guide.cjs');
const upload = require('../middleware/upload.cjs');
const { auth, authorize } = require('../middleware/auth.cjs');

const router = express.Router();

// Get all users (Principal only)
router.get('/', auth, authorize('principal'), async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    let userProfile = { ...req.user.toJSON() };

    // Get role-specific data
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id })
        .populate('team', 'name projectTitle');
      if (student) {
        userProfile.profile = student;
      }
    } else if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id })
        .populate('assignedTeams', 'name projectTitle');
      if (guide) {
        userProfile.profile = guide;
      }
    }

    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'email'];
    
    // Update user basic info
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        req.user[key] = updates[key];
      }
    });

    await req.user.save();

    // Update role-specific profile
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (student && updates.profile) {
        const profileUpdates = updates.profile;
        const allowedProfileUpdates = ['skills', 'domain'];
        
        allowedProfileUpdates.forEach(key => {
          if (profileUpdates[key] !== undefined) {
            student[key] = profileUpdates[key];
          }
        });
        
        await student.save();
      }
    } else if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      if (guide && updates.profile) {
        const profileUpdates = updates.profile;
        const allowedProfileUpdates = ['expertise', 'maxTeams'];
        
        allowedProfileUpdates.forEach(key => {
          if (profileUpdates[key] !== undefined) {
            guide[key] = profileUpdates[key];
          }
        });
        
        await guide.save();
      }
    }

    res.json({
      message: 'Profile updated successfully',
      user: req.user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile image
router.post('/profile/image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    req.user.profileImage = `/uploads/profiles/${req.file.filename}`;
    await req.user.save();

    res.json({
      message: 'Profile image updated successfully',
      profileImage: req.user.profileImage
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate user (Principal only)
router.put('/:id/deactivate', auth, authorize('principal'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reactivate user (Principal only)
router.put('/:id/activate', auth, authorize('principal'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;