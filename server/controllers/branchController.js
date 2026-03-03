const asyncHandler = require('express-async-handler');
const Branch = require('../models/Branch');

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private/Admin
const getBranches = asyncHandler(async (req, res) => {
    const branches = await Branch.find({});
    res.json(branches);
});

// @desc    Get branch by ID
// @route   GET /api/branches/:id
// @access  Private/Admin
const getBranchById = asyncHandler(async (req, res) => {
    const branch = await Branch.findById(req.params.id);
    if (branch) {
        res.json(branch);
    } else {
        res.status(404);
        throw new Error('Branch not found');
    }
});

// @desc    Create a branch
// @route   POST /api/branches
// @access  Private/SuperAdmin
const createBranch = asyncHandler(async (req, res) => {
    const { name, address, phone } = req.body;
    const branch = await Branch.create({ name, address, phone });
    res.status(201).json(branch);
});

// @desc    Update a branch
// @route   PUT /api/branches/:id
// @access  Private/SuperAdmin
const updateBranch = asyncHandler(async (req, res) => {
    const branch = await Branch.findById(req.params.id);
    if (branch) {
        branch.name = req.body.name || branch.name;
        branch.address = req.body.address || branch.address;
        branch.phone = req.body.phone || branch.phone;
        branch.isActive = req.body.isActive !== undefined ? req.body.isActive : branch.isActive;

        const updatedBranch = await branch.save();
        res.json(updatedBranch);
    } else {
        res.status(404);
        throw new Error('Branch not found');
    }
});

// @desc    Delete a branch
// @route   DELETE /api/branches/:id
// @access  Private/SuperAdmin
const deleteBranch = asyncHandler(async (req, res) => {
    const branch = await Branch.findById(req.params.id);
    if (branch) {
        await branch.deleteOne();
        res.json({ message: 'Branch removed' });
    } else {
        res.status(404);
        throw new Error('Branch not found');
    }
});

module.exports = {
    getBranches,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch,
};
