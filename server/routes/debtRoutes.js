const express = require('express');
const router = express.Router();
const { getDebts, addDebt, payDebt, deleteDebt } = require('../controllers/debtController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, checkPermission('debts'), getDebts)
    .post(protect, checkPermission('debts'), addDebt);

router.route('/:id/pay')
    .post(protect, checkPermission('debts'), payDebt);

router.route('/:id')
    .delete(protect, checkPermission('debts'), deleteDebt);

module.exports = router;
