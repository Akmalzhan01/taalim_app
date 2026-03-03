const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private/Admin
const getTasks = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    } else if (req.query.branch) {
        query.branch = req.query.branch;
    }
    const tasks = await Task.find(query).sort({ order: 1, createdAt: -1 });
    res.json(tasks);
});

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = asyncHandler(async (req, res) => {
    const { title, description, status, priority, dueDate } = req.body;

    const task = new Task({
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate,
        branch: req.user.branch,
        order: await Task.countDocuments({ status: status || 'todo', branch: req.user.branch })
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private/Admin
const updateTask = asyncHandler(async (req, res) => {
    const { title, description, status, priority, dueDate, order } = req.body;

    const task = await Task.findById(req.params.id);

    if (task) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!task.branch || task.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to update this task from another branch');
            }
        }
        task.title = title || task.title;
        task.description = description !== undefined ? description : task.description;
        task.status = status || task.status;
        task.priority = priority || task.priority;
        task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
        if (order !== undefined) {
            task.order = order;
        }

        const updatedTask = await task.save();
        res.json(updatedTask);
    } else {
        res.status(404);
        throw new Error('Task not found');
    }
});

// @desc    Update task statuses (Drag and Drop)
// @route   PUT /api/tasks/reorder
// @access  Private/Admin
const updateTaskOrder = asyncHandler(async (req, res) => {
    const { items } = req.body;
    // items is an array of { id, status, order }

    if (items && items.length > 0) {
        for (const item of items) {
            await Task.findByIdAndUpdate(item.id, {
                status: item.status,
                order: item.order
            });
        }
        res.json({ message: 'Task order updated' });
    } else {
        res.status(400);
        throw new Error('No items provided for reordering');
    }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (task) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!task.branch || task.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to delete this task from another branch');
            }
        }
        await task.deleteOne();
        res.json({ message: 'Task removed' });
    } else {
        res.status(404);
        throw new Error('Task not found');
    }
});

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskOrder
};
