const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
const Student = require('../models/Student.cjs');
const Guide = require('../models/Guide.cjs');
const { auth } = require('../middleware/auth.cjs');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, ...additionalData } = req.body;

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
      role
    });

    await user.save();

    // Create role-specific profile
    if (role === 'student' || role === 'team_lead') {
      const student = new Student({
        user: user._id,
        ...additionalData
      });
      await student.save();
    } else if (role === 'guide') {
      const guide = new Guide({
        user: user._id,
        ...additionalData
      });
      await guide.save();
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
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
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', auth, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;