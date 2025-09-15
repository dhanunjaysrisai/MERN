const express = require('express');
const Document = require('../models/Document.cjs');
const Student = require('../models/Student.cjs');
const Guide = require('../models/Guide.cjs');
const upload = require('../middleware/upload.cjs');
const { auth, authorize } = require('../middleware/auth.cjs');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Get documents
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

    const documents = await Document.find(query)
      .populate('team', 'name projectTitle')
      .populate({
        path: 'uploadedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get document by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('team', 'name projectTitle members')
      .populate({
        path: 'uploadedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.team?.toString() !== document.team._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      const Team = require('../models/Team.cjs');
      const team = await Team.findById(document.team._id);
      if (!guide || team.guide?.toString() !== guide._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload document (Students/Team leads only)
router.post('/', auth, authorize('student', 'team_lead'), upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { teamId, name, type, description } = req.body;

    // Get student profile
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Verify student belongs to the team
    if (student.team?.toString() !== teamId) {
      return res.status(403).json({ message: 'You can only upload documents for your own team' });
    }

    // Check if document with same name exists
    const existingDoc = await Document.findOne({ team: teamId, name });
    if (existingDoc) {
      // Mark previous version as not latest
      await Document.updateMany(
        { team: teamId, name },
        { isLatest: false }
      );
    }

    // Create document record
    const document = new Document({
      team: teamId,
      name,
      type,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: student._id,
      description,
      version: existingDoc ? existingDoc.version + 1 : 1
    });

    await document.save();
    await document.populate([
      { path: 'team', select: 'name projectTitle' },
      {
        path: 'uploadedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      }
    ]);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download document
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('team', 'name projectTitle members');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.team?.toString() !== document.team._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'guide') {
      const guide = await Guide.findOne({ user: req.user._id });
      const Team = require('../models/Team.cjs');
      const team = await Team.findById(document.team._id);
      if (!guide || team.guide?.toString() !== guide._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Check if file exists
    if (!fs.existsSync(document.path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(document.path, document.originalName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update document metadata
router.put('/:id', auth, authorize('student', 'team_lead'), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get student profile
    const student = await Student.findOne({ user: req.user._id });
    if (!student || student.team?.toString() !== document.team.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'description', 'type'];
    
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        document[key] = updates[key];
      }
    });

    await document.save();
    await document.populate([
      { path: 'team', select: 'name projectTitle' },
      {
        path: 'uploadedBy',
        populate: {
          path: 'user',
          select: 'name email'
        }
      }
    ]);

    res.json({
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user.role === 'student' || req.user.role === 'team_lead') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.team?.toString() !== document.team.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role !== 'principal') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;