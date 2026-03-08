const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin
const getCustomers = asyncHandler(async (req, res) => {
    const customers = await Customer.find({}).sort({ totalPurchasedAmount: -1 });
    res.json(customers);
});

// @desc    Search customer by phone
// @route   GET /api/customers/search/:phone
// @access  Private/Cashier
const searchCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ phone: req.params.phone });
    if (customer) {
        res.json(customer);
    } else {
        res.status(404);
        throw new Error('Mijoz topilmadi');
    }
});

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private/Cashier
const createCustomer = asyncHandler(async (req, res) => {
    const { name, phone, branch } = req.body;

    const customerExists = await Customer.findOne({ phone });

    if (customerExists) {
        res.status(400);
        throw new Error('Ushbu raqam bilan mijoz allaqachon ro\'yxatdan oclingan');
    }

    const customer = await Customer.create({
        name,
        phone,
        branch
    });

    if (customer) {
        res.status(201).json(customer);
    } else {
        res.status(400);
        throw new Error('Mijoz ma\'lumotlari noto\'g\'ri');
    }
});

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
const updateCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
        customer.name = req.body.name || customer.name;
        customer.phone = req.body.phone || customer.phone;
        customer.branch = req.body.branch || customer.branch;

        const updatedCustomer = await customer.save();
        res.json(updatedCustomer);
    } else {
        res.status(404);
        throw new Error('Mijoz topilmadi');
    }
});

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
        await customer.deleteOne();
        res.json({ message: 'Mijoz o\'chirildi' });
    } else {
        res.status(404);
        throw new Error('Mijoz topilmadi');
    }
});

module.exports = {
    getCustomers,
    searchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
};
