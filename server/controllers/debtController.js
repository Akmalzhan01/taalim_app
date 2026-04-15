const asyncHandler = require('express-async-handler');
const Debt = require('../models/Debt');

// @desc    Get all debts
// @route   GET /api/debts
// @access  Private/Admin
const getDebts = asyncHandler(async (req, res) => {
    let query = {};

    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    } else if (req.query.branch) {
        query.branch = req.query.branch;
    }

    const debts = await Debt.find(query)
        .populate('createdBy', 'name email')
        .populate('paymentHistory.handledBy', 'name')
        .sort({ createdAt: -1 });

    res.json(debts);
});

// @desc    Add new debt
// @route   POST /api/debts
// @access  Private/Admin
const addDebt = asyncHandler(async (req, res) => {
    const { creditorName, creditorPhone, amount, date, description, branch } = req.body;

    if (!creditorName || !amount) {
        res.status(400);
        throw new Error('Kreditor ismi va qarz miqdori kiritilishi shart');
    }

    let debtBranch = req.user.branch;
    if (req.user.role === 'superadmin' || !debtBranch) {
        debtBranch = branch;
    }

    if (!debtBranch) {
        res.status(400);
        throw new Error('Filial kiritilishi shart');
    }

    const debt = new Debt({
        creditorName,
        creditorPhone: creditorPhone || '',
        amount: Number(amount),
        paidAmount: 0,
        debtAmount: Number(amount),
        status: 'active',
        date: date || Date.now(),
        description: description || '',
        paymentHistory: [],
        branch: debtBranch,
        createdBy: req.user._id,
    });

    const createdDebt = await debt.save();
    res.status(201).json(createdDebt);
});

// @desc    Pay debt (partial or full)
// @route   POST /api/debts/:id/pay
// @access  Private/Admin
const payDebt = asyncHandler(async (req, res) => {
    const { amount, note } = req.body;
    const debt = await Debt.findById(req.params.id);

    if (!debt) {
        res.status(404);
        throw new Error('Qarz topilmadi');
    }

    if (debt.status === 'paid' || debt.debtAmount <= 0) {
        res.status(400);
        throw new Error('Bu qarz allaqachon to\'liq to\'langan');
    }

    const payment = Number(amount);
    if (isNaN(payment) || payment <= 0) {
        res.status(400);
        throw new Error('To\'lov miqdori noto\'g\'ri');
    }

    debt.paidAmount += payment;
    debt.debtAmount = Math.max(0, debt.debtAmount - payment);

    if (debt.debtAmount === 0) {
        debt.status = 'paid';
    }

    debt.paymentHistory.push({
        amount: payment,
        date: Date.now(),
        note: note || '',
        handledBy: req.user._id,
    });

    const updatedDebt = await debt.save();
    res.json(updatedDebt);
});

// @desc    Delete debt
// @route   DELETE /api/debts/:id
// @access  Private/Admin
const deleteDebt = asyncHandler(async (req, res) => {
    const debt = await Debt.findById(req.params.id);

    if (!debt) {
        res.status(404);
        throw new Error('Qarz topilmadi');
    }

    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        const userBranch = (req.user.branch._id || req.user.branch).toString();
        if (!debt.branch || debt.branch.toString() !== userBranch) {
            res.status(403);
            throw new Error('Boshqa filial qarzini o\'chirish mumkin emas');
        }
    }

    await debt.deleteOne();
    res.json({ message: 'Qarz o\'chirildi', id: req.params.id });
});

module.exports = { getDebts, addDebt, payDebt, deleteDebt };
