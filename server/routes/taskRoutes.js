const express = require('express');
const router = express.Router();
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskOrder
} = require('../controllers/taskController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, checkPermission('kanban'), getTasks)
    .post(protect, checkPermission('kanban'), createTask);

router.route('/reorder')
    .put(protect, checkPermission('kanban'), updateTaskOrder);

router.route('/:id')
    .put(protect, checkPermission('kanban'), updateTask)
    .delete(protect, checkPermission('kanban'), deleteTask);

module.exports = router;
