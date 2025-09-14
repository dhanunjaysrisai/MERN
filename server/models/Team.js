const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  guide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide',
    default: null
  },
  projectTitle: {
    type: String,
    required: true,
    trim: true
  },
  projectDescription: {
    type: String,
    trim: true
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
  status: {
    type: String,
    enum: ['active', 'completed', 'on_hold', 'cancelled'],
    default: 'active'
  },
  averagePercentage: {
    type: Number,
    default: 0
  },
  technologies: [{
    type: String,
    trim: true
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  expectedEndDate: {
    type: Date
  },
  actualEndDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Calculate average percentage when team is saved
teamSchema.pre('save', async function(next) {
  if (this.members && this.members.length > 0) {
    try {
      await this.populate('members');
      const totalPercentage = this.members.reduce((sum, member) => {
        return sum + (member.percentage || 0);
      }, 0);
      this.averagePercentage = totalPercentage / this.members.length;
    } catch (error) {
      console.error('Error calculating average percentage:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);