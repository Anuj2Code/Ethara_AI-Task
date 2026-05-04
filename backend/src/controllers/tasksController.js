const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');

const populateTask = (query) =>
  query
    .populate('projectId', 'name color members')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

// GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const {
      projectId,
      projectType,
      assignedTo,
      status,
      priority,
      search,
      sortBy = 'dueDate',
      order = 'asc',
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // Access control only if using real projectId
    if (req.user.role !== 'admin' && !projectType) {
      const myProjects = await Project.find({ members: req.user._id }).select('_id');
      filter.projectId = { $in: myProjects.map((p) => p._id) };
    }

    // ✅ Only allow valid ObjectId
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      filter.projectId = projectId;
    }

    // ✅ New string-based filter
    if (projectType) filter.projectType = projectType;

    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const sortMap = { asc: 1, desc: -1 };
    const sortOrder = sortMap[order] || 1;

    const sortField = ['dueDate', 'priority', 'title', 'createdAt', 'status'].includes(sortBy)
      ? sortBy
      : 'dueDate';

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Task.countDocuments(filter);

    const tasks = await populateTask(
      Task.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(Number(limit))
    );

    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / limit) });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/my
const getMyTasks = async (req, res) => {
  try {
    const tasks = await populateTask(
      Task.find({ assignedTo: req.user._id }).sort({ dueDate: 1 })
    );
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/overdue
const getOverdueTasks = async (req, res) => {
  try {
    const filter = {
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    };

    if (req.user.role !== 'admin') {
      const myProjects = await Project.find({ members: req.user._id }).select('_id');
      filter.projectId = { $in: myProjects.map((p) => p._id) };
    }

    const tasks = await populateTask(Task.find(filter).sort({ dueDate: 1 }));
    res.json({ tasks });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await populateTask(Task.findById(req.params.id));
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json({ task });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      projectType,
      assignedTo,
      status,
      priority,
      dueDate,
    } = req.body;

    let finalProjectId = null;

    // ✅ Only process valid ObjectId
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const isMember = project.members.some(
        (m) => m.toString() === req.user._id.toString()
      );

      if (!isMember && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not a member of this project' });
      }

      finalProjectId = projectId;
    }

    const task = await Task.create({
      title,
      description,
      projectId: finalProjectId,      // null if invalid
      projectType: projectType || null, // ✅ string stored
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });

    const populated = await populateTask(Task.findById(task._id));

    res.status(201).json({ task: populated });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isOwner = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

    if (!isOwner && !isAssignee && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const fields = [
      'title',
      'description',
      'assignedTo',
      'status',
      'priority',
      'dueDate',
      'projectType',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) task[f] = req.body[f];
    });

    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.json({ task: populated });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isOwner = task.createdBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only creator or admin can delete' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role !== 'admin') {
      const myProjects = await Project.find({ members: req.user._id }).select('_id');
      filter.projectId = { $in: myProjects.map((p) => p._id) };
    }

    const [total, done, inProgress, overdue] = await Promise.all([
      Task.countDocuments(filter),
      Task.countDocuments({ ...filter, status: 'done' }),
      Task.countDocuments({ ...filter, status: 'progress' }),
      Task.countDocuments({
        ...filter,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
    ]);

    res.json({ stats: { total, done, inProgress, overdue } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getTasks,
  getMyTasks,
  getOverdueTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
};