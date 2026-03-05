const asyncHandler = require('express-async-handler');
const Expenditure = require('../models/Expenditure');

// @desc    Get expenditures for a date range (default today)
// @route   GET /api/expenditures
// @access  Private/Admin
const getExpenditures = asyncHandler(async (req, res) => {
    let startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    if (req.query.date) {
        const queryDate = new Date(req.query.date);
        startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
    }

    let query = {
        date: { $gte: startOfDay, $lte: endOfDay }
    };

    // Branch Filter
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    } else if (req.query.branch) {
        query.branch = req.query.branch;
    }

    const expenditures = await Expenditure.find(query).populate('user', 'name');

    res.json(expenditures);
});

// @desc    Create new expenditure
// @route   POST /api/expenditures
// @access  Private/Admin
const addExpenditure = asyncHandler(async (req, res) => {
    const { title, amount, category, description, date } = req.body;

    if (!title || !amount) {
        res.status(400);
        throw new Error('Please provide both title and amount');
    }

    const expenditure = await Expenditure.create({
        title,
        amount,
        category: category || 'Other',
        description,
        date: date || Date.now(),
        user: req.user._id,
        branch: req.body.branch || req.user.branch, // Improved branch association
    });

    const populatedExp = await Expenditure.findById(expenditure._id).populate('user', 'name');

    res.status(201).json(populatedExp);
});

// @desc    Delete expenditure
// @route   DELETE /api/expenditures/:id
// @access  Private/Admin
const deleteExpenditure = asyncHandler(async (req, res) => {
    const expenditure = await Expenditure.findById(req.params.id);

    if (expenditure) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!expenditure.branch || expenditure.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to delete this expenditure from another branch');
            }
        }

        await Expenditure.deleteOne({ _id: req.params.id });
        res.json({ id: req.params.id });
    } else {
        res.status(404);
        throw new Error('Expenditure not found');
    }
});

// @desc    Update expenditure
// @route   PUT /api/expenditures/:id
// @access  Private/Admin
const updateExpenditure = asyncHandler(async (req, res) => {
    const { title, amount, category, description, date } = req.body;
    const expenditure = await Expenditure.findById(req.params.id);

    if (expenditure) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!expenditure.branch || expenditure.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to update this expenditure from another branch');
            }
        }

        expenditure.title = title || expenditure.title;
        expenditure.amount = amount || expenditure.amount;
        expenditure.category = category || expenditure.category;
        expenditure.description = description === undefined ? expenditure.description : description;
        expenditure.date = date || expenditure.date;

        const updatedExpenditure = await expenditure.save();
        const populatedExp = await Expenditure.findById(updatedExpenditure._id).populate('user', 'name');
        res.json(populatedExp);
    } else {
        res.status(404);
        throw new Error('Expenditure not found');
    }
});

module.exports = {
    getExpenditures,
    addExpenditure,
    deleteExpenditure,
    updateExpenditure,
};
