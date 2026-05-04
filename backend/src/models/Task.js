const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    // ✅ OPTIONAL (old system)
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,   // ❗ FIXED
      default: null,
    },

    // ✅ NEW FIELD (main system now)
    projectType: {
      type: String,
      enum: ['web-design', 'mobile-app', 'api-integration'],
      required: false,
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['todo', 'progress', 'done'],
      default: 'todo',
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Updated indexes
taskSchema.index({ projectType: 1, status: 1 }); // NEW
taskSchema.index({ projectId: 1, status: 1 });   // keep for old data
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);