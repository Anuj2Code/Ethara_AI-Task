const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getTasks,
  getMyTasks,
  getOverdueTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
} = require('../controllers/tasksController');

const router = express.Router();

router.use(protect);

router.get('/my', getMyTasks);
router.get('/overdue', getOverdueTasks);
router.get('/dashboard-stats', getDashboardStats);
router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
