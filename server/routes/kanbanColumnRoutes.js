const express = require('express');
const router = express.Router();
const {
    getColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns
} = require('../controllers/kanbanColumnController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, checkPermission('kanban'), getColumns)
    .post(protect, checkPermission('kanban'), createColumn);

router.route('/reorder')
    .put(protect, checkPermission('kanban'), reorderColumns);

router.route('/:id')
    .put(protect, checkPermission('kanban'), updateColumn)
    .delete(protect, checkPermission('kanban'), deleteColumn);

module.exports = router;
