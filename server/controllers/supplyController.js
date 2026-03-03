const asyncHandler = require('express-async-handler');
const Supply = require('../models/Supply');
const Book = require('../models/Book');

// @desc    Add new supply
// @route   POST /api/supplies
// @access  Private/Admin
const addSupply = asyncHandler(async (req, res) => {
    const { items, totalCost, date } = req.body;

    if (items && items.length === 0) {
        res.status(400);
        throw new Error('No supply items');
    } else {
        const supply = new Supply({
            createdBy: req.user._id,
            branch: req.user.branch, // Added branch
            items,
            totalCost,
            date: date || Date.now(),
        });

        const createdSupply = await supply.save();

        // Update stock for each product
        for (const item of items) {
            const book = await Book.findById(item.product);
            if (book) {
                book.countInStock += item.qty;
                await book.save();
            }
        }

        res.status(201).json(createdSupply);
    }
});

// @desc    Get all supplies
// @route   GET /api/supplies
// @access  Private/Admin
const getSupplies = asyncHandler(async (req, res) => {
    let query = {};

    // Branch Filter
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    } else if (req.query.branch) {
        query.branch = req.query.branch;
    }

    const supplies = await Supply.find(query)
        .populate('createdBy', 'name email')
        .populate('items.product', 'title')
        .sort({ createdAt: -1 });
    res.json(supplies);
});

// @desc    Get supply by ID
// @route   GET /api/supplies/:id
// @access  Private/Admin
const getSupplyById = asyncHandler(async (req, res) => {
    const supply = await Supply.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('items.product', 'title price costPrice');

    if (supply) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!supply.branch || supply.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to view this supply from another branch');
            }
        }
        res.json(supply);
    } else {
        res.status(404);
        throw new Error('Supply not found');
    }
});

// @desc    Delete supply
// @route   DELETE /api/supplies/:id
// @access  Private/Admin
const deleteSupply = asyncHandler(async (req, res) => {
    const supply = await Supply.findById(req.params.id);

    if (supply) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!supply.branch || supply.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to delete this supply from another branch');
            }
        }

        // Revert stock for each product
        for (const item of supply.items) {
            const book = await Book.findById(item.product);
            if (book) {
                // Prevent negative stock
                book.countInStock = Math.max(0, book.countInStock - item.qty);
                await book.save();
            }
        }

        await supply.deleteOne();
        res.json({ message: 'Supply removed and stock reverted' });
    } else {
        res.status(404);
        throw new Error('Supply not found');
    }
});

module.exports = {
    addSupply,
    getSupplies,
    getSupplyById,
    deleteSupply,
};
