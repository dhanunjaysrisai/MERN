const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: [
      'computer-science',
      'information-technology',
      'electronics',
      'mechanical',
      'electrical',
      'civil'
    ]
  },
  expertise: [{
    type: String,
    trim: true
  }],
  maxTeams: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 3
  },
  currentTeams: {
    type: Number,
    default: 0,
    min: 0
  },
  assignedTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  qualification: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Update current teams count when teams are assigned/removed
guideSchema.methods.updateTeamCount = function() {
  this.currentTeams = this.assignedTeams.length;
  return this.save();
};

module.exports = mongoose.model('Guide', guideSchema);