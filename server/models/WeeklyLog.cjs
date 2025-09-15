const mongoose = require('mongoose');

const weeklyLogSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  week: {
    type: Number,
    required: true,
    min: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  completedTasks: [{
    type: String,
    trim: true
  }],
  nextWeekPlans: [{
    type: String,
    trim: true
  }],
  challenges: [{
    type: String,
    trim: true
  }],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  guideApproval: {
    type: Boolean,
    default: false
  },
  guideFeedback: {
    type: String,
    trim: true,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }]
}, {
  timestamps: true
});

// Ensure unique week per team
weeklyLogSchema.index({ team: 1, week: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyLog', weeklyLogSchema);