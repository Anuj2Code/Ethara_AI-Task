const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    color: {
      type: String,
      default: '#6c63ff',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Ensure creator is always a member
projectSchema.pre('save', function (next) {
  const creatorId = this.createdBy.toString();
  const memberIds = this.members.map((m) => m.toString());
  if (!memberIds.includes(creatorId)) {
    this.members.unshift(this.createdBy);
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
