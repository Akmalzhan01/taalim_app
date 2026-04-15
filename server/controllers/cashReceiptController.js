const asyncHandler = require('express-async-handler');
const CashReceipt = require('../models/CashReceipt');

// @desc    Get all cash receipts
// @route   GET /api/cash-receipts
// @access  Private/Admin
const getCashReceipts = asyncHandler(async (req, res) => {
    let query = {};

    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    } else if (req.query.branch) {
        query.branch = req.query.branch;
    }

    const receipts = await CashReceipt.find(query)
        .populate('createdBy', 'name email')
        .sort({ date: -1 });

    res.json(receipts);
});

// @desc    Add new cash receipt
// @route   POST /api/cash-receipts
// @access  Private/Admin
const addCashReceipt = asyncHandler(async (req, res) => {
    const { donorName, donorPhone, amount, description, date, branch } = req.body;

    if (!donorName || !amount) {
        res.status(400);
        throw new Error('Имя отправителя и сумма обязательны');
    }

    let receiptBranch = req.user.branch;
    if (req.user.role === 'superadmin' || !receiptBranch) {
        receiptBranch = branch;
    }

    if (!receiptBranch) {
        res.status(400);
        throw new Error('Филиал обязателен');
    }

    const receipt = new CashReceipt({
        donorName,
        donorPhone: donorPhone || '',
        amount: Number(amount),
        description: description || '',
        date: date || Date.now(),
        branch: receiptBranch,
        createdBy: req.user._id,
    });

    const created = await receipt.save();
    res.status(201).json(created);
});

// @desc    Delete cash receipt
// @route   DELETE /api/cash-receipts/:id
// @access  Private/Admin
const deleteCashReceipt = asyncHandler(async (req, res) => {
    const receipt = await CashReceipt.findById(req.params.id);

    if (!receipt) {
        res.status(404);
        throw new Error('Запись не найдена');
    }

    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        const userBranch = (req.user.branch._id || req.user.branch).toString();
        if (!receipt.branch || receipt.branch.toString() !== userBranch) {
            res.status(403);
            throw new Error('Нет доступа к записям другого филиала');
        }
    }

    await receipt.deleteOne();
    res.json({ message: 'Запись удалена', id: req.params.id });
});

module.exports = { getCashReceipts, addCashReceipt, deleteCashReceipt };
