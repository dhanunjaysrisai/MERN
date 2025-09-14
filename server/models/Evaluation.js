const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide',
    required: true
  },
  type: {
    type: String,
    enum: ['weekly', 'mid_term', 'final', 'presentation'],
    required: true
  },
  scores: {
    technical: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    innovation: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    implementation: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    presentation: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    teamwork: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  totalScore: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    default: null
  },
  feedback: {
    type: String,
    required: true,
    trim: true
  },
  suggestions: {
    type: String,
    trim: true
  },
  evaluationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate total score and grade before saving
evaluationSchema.pre('save', function(next) {
  const { technical, innovation, implementation, presentation, teamwork } = this.scores;
  this.totalScore = (technical + innovation + implementation + presentation + teamwork) / 5;
  
  // Calculate grade based on total score
  if (this.totalScore >= 90) this.grade = 'A+';
  else if (this.totalScore >= 85) this.grade = 'A';
  else if (this.totalScore >= 80) this.grade = 'B+';
  else if (this.totalScore >= 75) this.grade = 'B';
  else if (this.totalScore >= 70) this.grade = 'C+';
  else if (this.totalScore >= 65) this.grade = 'C';
  else if (this.totalScore >= 50) this.grade = 'D';
  else this.grade = 'F';
  
  next();
});

module.exports = mongoose.model('Evaluation', evaluationSchema);