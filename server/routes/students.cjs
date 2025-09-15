const express = require('express');
const Student = require('../models/Student.cjs');
const User = require('../models/User.cjs');
const { auth, authorize } = require('../middleware/auth.cjs');

const router = express.Router();

// Get all students (Principal only)
router.get('/', auth, authorize('principal'), async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user', 'name email')
      .populate('team', 'name projectTitle')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email')
      .populate('team', 'name projectTitle members');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check permissions
    if (req.user.role !== 'principal' && 
        req.user.role !== 'guide' && 
        student.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create student (Principal only)
router.post('/', auth, authorize('principal'), async (req, res) => {
  try {
    const { name, email, password, rollNumber, percentage, domain, backlogs, skills, academicYear, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if roll number already exists
    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists with this roll number' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: 'student'
    });
    await user.save();

    // Create student profile
    const student = new Student({
      user: user._id,
      rollNumber,
      percentage: backlogs > 0 ? 0 : percentage,
      domain,
      backlogs,
      skills: skills || [],
      academicYear,
      department
    });
    await student.save();

    // Populate user data for response
    await student.populate('user', 'name email');

    res.status(201).json({
      message: 'Student created successfully',
      student
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student
router.put('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check permissions
    if (req.user.role !== 'principal' && 
        student.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    
    // Ensure students with backlogs have 0 percentage
    if (updates.backlogs > 0) {
      updates.percentage = 0;
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        student[key] = updates[key];
      }
    });

    await student.save();
    await student.populate('user', 'name email');
    await student.populate('team', 'name projectTitle');

    res.json({
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete student (Principal only)
router.delete('/:id', auth, authorize('principal'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Remove from team if assigned
    if (student.team) {
      const Team = require('../models/Team');
      await Team.findByIdAndUpdate(
        student.team,
        { $pull: { members: student._id } }
      );
    }

    // Delete student and associated user
    await Student.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(student.user);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students without teams (Principal only)
router.get('/unassigned/list', auth, authorize('principal'), async (req, res) => {
  try {
    const students = await Student.find({ team: null })
      .populate('user', 'name email')
      .sort({ percentage: -1 });

    res.json(students);
  } catch (error) {
    console.error('Get unassigned students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;