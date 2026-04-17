const asyncHandler = require('express-async-handler');
const Supply = require('../models/Supply');
const Book = require('../models/Book');
const SupplyBatch = require('../models/SupplyBatch');
const Vendor = require('../models/Vendor');

// @desc    Add new supply
// @route   POST /api/supplies
// @access  Private/Admin
const addSupply = asyncHandler(async (req, res) => {
    const { items, totalCost, totalAmount, date, supplierName, supplierPhone, paymentStatus, paidAmount, branch, type } = req.body;

    const actualTotalCost = totalCost || totalAmount || 0;

    if (items && items.length === 0) {
        res.status(400);
        throw new Error('No supply items');
    } else {
        const debtAmount = paymentStatus === 'debt' ? Math.max(0, actualTotalCost - Number(paidAmount || 0)) : 0;
        const actualPaid = paymentStatus === 'debt' ? Number(paidAmount || 0) : actualTotalCost;

        let supplyBranch = req.user.branch;
        if (req.user.role === 'superadmin' || !supplyBranch) {
            supplyBranch = branch;
        }

        if (!supplyBranch) {
            res.status(400);
            throw new Error('Branch is required');
        }

        let paymentHistory = [];
        if (actualPaid > 0) {
            paymentHistory.push({
                amount: actualPaid,
                date: date || Date.now(),
                handledBy: req.user._id
            });
        }

        const supplyType = type === 'adjustment' ? 'adjustment' : 'purchase';

        const supply = new Supply({
            createdBy: req.user._id,
            branch: supplyBranch,
            items,
            totalCost: actualTotalCost,
            date: date || Date.now(),
            supplierName,
            supplierPhone,
            paymentStatus: supplyType === 'adjustment' ? 'paid' : (paymentStatus || 'paid'),
            paidAmount: supplyType === 'adjustment' ? 0 : actualPaid,
            debtAmount: supplyType === 'adjustment' ? 0 : debtAmount,
            paymentHistory: supplyType === 'adjustment' ? [] : paymentHistory,
            type: supplyType,
        });

        const createdSupply = await supply.save();

        // Update or create Vendor stats (only for real purchases)
        if (supplierName && supplyType === 'purchase') {
            let vendor = await Vendor.findOne({ name: supplierName, branch: supplyBranch });
            if (!vendor) {
                vendor = new Vendor({
                    name: supplierName,
                    phone: supplierPhone || '',
                    branch: supplyBranch,
                    totalSuppliedAmount: actualTotalCost,
                    totalSupplies: 1
                });
            } else {
                vendor.totalSuppliedAmount += actualTotalCost;
                vendor.totalSupplies += 1;
                if (supplierPhone && !vendor.phone) {
                    vendor.phone = supplierPhone;
                }
            }
            await vendor.save();
        }

        // Update stock and create FIFO batches for each product
        for (const item of items) {
            const book = await Book.findById(item.product);
            if (book) {
                // 1. Update general stock (cache)
                book.countInStock += item.qty;
                await book.save();

                // 2. Create FIFO Batch
                const batch = new SupplyBatch({
                    book: item.product,
                    branch: supplyBranch,
                    costPrice: item.purchasePrice,
                    quantity: item.qty,
                    initialQuantity: item.qty,
                    dateReceived: date || Date.now(),
                });
                await batch.save();
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
        .populate('items.product', 'title price');

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

// @desc    Pay debt for a supply
// @route   POST /api/supplies/:id/pay
// @access  Private/Admin
const payDebt = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const supply = await Supply.findById(req.params.id);

    if (supply) {
        if (supply.paymentStatus !== 'debt' || supply.debtAmount <= 0) {
            res.status(400);
            throw new Error('No debt to pay for this supply');
        }

        const payment = Number(amount);
        if (isNaN(payment) || payment <= 0) {
            res.status(400);
            throw new Error('Invalid payment amount');
        }

        supply.paidAmount += payment;
        supply.debtAmount = Math.max(0, supply.debtAmount - payment);

        if (supply.debtAmount === 0) {
            supply.paymentStatus = 'paid';
        }

        if (!supply.paymentHistory) {
            supply.paymentHistory = [];
        }

        supply.paymentHistory.push({
            amount: payment,
            date: Date.now(),
            handledBy: req.user._id
        });

        const updatedSupply = await supply.save();
        res.json(updatedSupply);
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

// @desc    Update supply (items, supplier, payment)
// @route   PUT /api/supplies/:id
// @access  Private/Admin
const updateSupply = asyncHandler(async (req, res) => {
    const supply = await Supply.findById(req.params.id);

    if (!supply) {
        res.status(404);
        throw new Error('Supply not found');
    }

    // Branch isolation check
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        const userBranch = (req.user.branch._id || req.user.branch).toString();
        if (!supply.branch || supply.branch.toString() !== userBranch) {
            res.status(403);
            throw new Error('Not authorized to edit this supply');
        }
    }

    const { items, totalCost, supplierName, supplierPhone, paymentStatus, paidAmount, date } = req.body;

    // 1. Revert old stock
    for (const oldItem of supply.items) {
        const book = await Book.findById(oldItem.product);
        if (book) {
            book.countInStock = Math.max(0, book.countInStock - oldItem.qty);
            await book.save();
        }
    }

    // 2. Apply new stock + create FIFO batches
    for (const newItem of items) {
        const book = await Book.findById(newItem.product);
        if (book) {
            book.countInStock += newItem.qty;
            await book.save();

            await new SupplyBatch({
                book: newItem.product,
                branch: supply.branch,
                costPrice: newItem.purchasePrice,
                quantity: newItem.qty,
                initialQuantity: newItem.qty,
                dateReceived: date || supply.date,
            }).save();
        }
    }

    const actualTotalCost = Number(totalCost) || 0;
    const debtAmount = paymentStatus === 'debt'
        ? Math.max(0, actualTotalCost - Number(paidAmount || 0))
        : 0;
    const actualPaid = paymentStatus === 'debt'
        ? Number(paidAmount || 0)
        : actualTotalCost;

    supply.items = items;
    supply.totalCost = actualTotalCost;
    supply.supplierName = supplierName !== undefined ? supplierName : supply.supplierName;
    supply.supplierPhone = supplierPhone !== undefined ? supplierPhone : supply.supplierPhone;
    supply.paymentStatus = paymentStatus || supply.paymentStatus;
    supply.paidAmount = actualPaid;
    supply.debtAmount = debtAmount;
    if (date) supply.date = date;

    const updatedSupply = await supply.save();
    res.json(updatedSupply);
});

module.exports = {
    addSupply,
    getSupplies,
    getSupplyById,
    payDebt,
    deleteSupply,
    updateSupply,
};
