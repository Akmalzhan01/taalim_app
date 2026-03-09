const asyncHandler = require('express-async-handler');
const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
const getSuppliers = asyncHandler(async (req, res) => {
    // Optionally filter by query if needed
    const suppliers = await Supplier.find({}).sort({ updatedAt: -1 });
    res.json(suppliers);
});

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private/Admin
const createSupplier = asyncHandler(async (req, res) => {
    const { name, phone, initialDebt } = req.body;

    const supplierExists = await Supplier.findOne({ name });
    if (supplierExists) {
        res.status(400);
        throw new Error('Supplier already exists');
    }

    const startingDebt = initialDebt ? Number(initialDebt) : 0;

    const supplier = await Supplier.create({
        name,
        phone,
        totalSuppliedAmount: startingDebt,
    });

    res.status(201).json(supplier);
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
const updateSupplier = asyncHandler(async (req, res) => {
    const { name, phone } = req.body;

    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
        supplier.name = name || supplier.name;
        supplier.phone = phone || supplier.phone;

        const updatedSupplier = await supplier.save();
        res.json(updatedSupplier);
    } else {
        res.status(404);
        throw new Error('Supplier not found');
    }
});

// @desc    Make a payment to supplier
// @route   POST /api/suppliers/:id/pay
// @access  Private/Admin
const paySupplier = asyncHandler(async (req, res) => {
    const { amount, comment } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid payment amount');
    }

    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
        supplier.totalPaidAmount += Number(amount);

        // Add to payment history
        if (!supplier.paymentHistory) {
            supplier.paymentHistory = [];
        }
        supplier.paymentHistory.push({
            amount: Number(amount),
            comment: comment || '',
            date: new Date()
        });

        const updatedSupplier = await supplier.save();

        // Optionally create an Expenditure record for this payment automatically
        // const Expenditure = require('../models/Expenditure');
        // await Expenditure.create({ title: `Payment to supplier: ${supplier.name}`, amount, date: new Date(), branch: req.user.branch, createdBy: req.user._id });

        res.json(updatedSupplier);
    } else {
        res.status(404);
        throw new Error('Supplier not found');
    }
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
const deleteSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
        await supplier.deleteOne();
        res.json({ message: 'Supplier removed' });
    } else {
        res.status(404);
        throw new Error('Supplier not found');
    }
});

module.exports = {
    getSuppliers,
    createSupplier,
    updateSupplier,
    paySupplier,
    deleteSupplier,
};
