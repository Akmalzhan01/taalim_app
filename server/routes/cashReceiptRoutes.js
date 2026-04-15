const express = require('express');
const router = express.Router();
const { getCashReceipts, addCashReceipt, deleteCashReceipt } = require('../controllers/cashReceiptController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, checkPermission('cash-receipts'), getCashReceipts)
    .post(protect, checkPermission('cash-receipts'), addCashReceipt);

router.route('/:id')
    .delete(protect, checkPermission('cash-receipts'), deleteCashReceipt);

module.exports = router;
