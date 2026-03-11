const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private/Admin
const getVendors = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    } else if (req.query.branch) {
        query.branch = req.query.branch;
    }

    const vendors = await Vendor.find(query).populate('branch', 'name').sort({ createdAt: -1 });
    res.json(vendors);
});

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private/Admin
const createVendor = asyncHandler(async (req, res) => {
    const { name, phone, branch } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Please add a name');
    }

    let vendorBranch = req.user.branch;
    if (req.user.role === 'superadmin' || !vendorBranch) {
        vendorBranch = branch;
    }

    if (!vendorBranch) {
        res.status(400);
        throw new Error('Branch is required');
    }

    const vendor = await Vendor.create({
        name,
        phone: phone || '',
        branch: vendorBranch
    });

    const populatedVendor = await Vendor.findById(vendor._id).populate('branch', 'name');
    res.status(201).json(populatedVendor);
});

// @desc    Update a vendor
// @route   PUT /api/vendors/:id
// @access  Private/Admin
const updateVendor = asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
        res.status(404);
        throw new Error('Vendor not found');
    }

    // Branch Isolation Check
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        const userBranch = (req.user.branch._id || req.user.branch).toString();
        if (!vendor.branch || vendor.branch.toString() !== userBranch) {
            res.status(403);
            throw new Error('Not authorized to update this vendor from another branch');
        }
    }

    const { name, phone, branch } = req.body;

    vendor.name = name || vendor.name;
    vendor.phone = phone || vendor.phone;

    if (req.user.role === 'superadmin' || req.user.isAdmin) {
        if (branch) vendor.branch = branch;
    }

    const updatedVendor = await vendor.save();
    const populatedVendor = await Vendor.findById(updatedVendor._id).populate('branch', 'name');

    res.json(populatedVendor);
});

// @desc    Delete a vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Admin
const deleteVendor = asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
        res.status(404);
        throw new Error('Vendor not found');
    }

    // Branch Isolation Check
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        const userBranch = (req.user.branch._id || req.user.branch).toString();
        if (!vendor.branch || vendor.branch.toString() !== userBranch) {
            res.status(403);
            throw new Error('Not authorized to delete this vendor from another branch');
        }
    }

    await vendor.deleteOne();

    res.json({ id: req.params.id });
});

module.exports = {
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor,
};
