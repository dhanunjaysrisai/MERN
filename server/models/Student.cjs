const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  domain: {
    type: String,
    required: true,
    enum: [
      'web-development',
      'mobile-development', 
      'data-science',
      'ai-ml',
      'cybersecurity',
      'blockchain',
      'iot',
      'cloud-computing'
    ]
  },
  backlogs: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  skills: [{
    type: String,
    trim: true
  }],
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  isTeamLead: {
    type: Boolean,
    default: false
  },
  academicYear: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Ensure students with backlogs have 0 percentage
studentSchema.pre('save', function(next) {
  if (this.backlogs > 0) {
    this.percentage = 0;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);