const asyncHandler = require('express-async-handler');
const KanbanColumn = require('../models/KanbanColumn');
const Task = require('../models/Task');

// @desc    Get all columns
// @route   GET /api/kanban-columns
// @access  Private/Admin
const getColumns = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    } else if (req.query.branch) {
        query.branch = req.query.branch;
    }
    const columns = await KanbanColumn.find(query).sort({ order: 1 });
    res.json(columns);
});

// @desc    Create a column
// @route   POST /api/kanban-columns
// @access  Private/Admin
const createColumn = asyncHandler(async (req, res) => {
    const { title, color } = req.body;

    const column = new KanbanColumn({
        title,
        color: color || 'slate',
        branch: req.user.branch,
        order: await KanbanColumn.countDocuments({ branch: req.user.branch })
    });

    const createdColumn = await column.save();
    res.status(201).json(createdColumn);
});

// @desc    Update a column
// @route   PUT /api/kanban-columns/:id
// @access  Private/Admin
const updateColumn = asyncHandler(async (req, res) => {
    const { title, color, order } = req.body;

    const column = await KanbanColumn.findById(req.params.id);

    if (column) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!column.branch || column.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to update this column from another branch');
            }
        }
        column.title = title || column.title;
        column.color = color || column.color;

        if (order !== undefined) {
            column.order = order;
        }

        const updatedColumn = await column.save();
        res.json(updatedColumn);
    } else {
        res.status(404);
        throw new Error('Column not found');
    }
});

// @desc    Delete a column
// @route   DELETE /api/kanban-columns/:id
// @access  Private/Admin
const deleteColumn = asyncHandler(async (req, res) => {
    const column = await KanbanColumn.findById(req.params.id);

    if (column) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!column.branch || column.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to delete this column from another branch');
            }
        }
        // Also delete tasks associated with this column?
        // Let's delete all tasks in this column for clean cascade
        await Task.deleteMany({ status: req.params.id });
        await column.deleteOne();
        res.json({ message: 'Column removed' });
    } else {
        res.status(404);
        throw new Error('Column not found');
    }
});

// @desc    Reorder columns (Drag and Drop)
// @route   PUT /api/kanban-columns/reorder
// @access  Private/Admin
const reorderColumns = asyncHandler(async (req, res) => {
    const { items } = req.body;
    // items is an array of { id, order }

    if (items && items.length > 0) {
        for (const item of items) {
            await KanbanColumn.findByIdAndUpdate(item.id, {
                order: item.order
            });
        }
        res.json({ message: 'Column order updated' });
    } else {
        res.status(400);
        throw new Error('No items provided for reordering');
    }
});

module.exports = {
    getColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns
};
