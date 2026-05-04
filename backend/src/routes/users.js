const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  updateRole,
  updateMe,
  updatePassword,
} = require('../controllers/usersController');

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/me', updateMe);
router.patch('/me/password', updatePassword);
router.patch('/:id/role', adminOnly, updateRole);

module.exports = router;
