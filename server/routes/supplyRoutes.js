const express = require('express');
const router = express.Router();
const {
    addSupply,
    getSupplies,
    getSupplyById,
    payDebt,
    deleteSupply,
    updateSupply,
} = require('../controllers/supplyController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, checkPermission('supplies'), addSupply)
    .get(protect, checkPermission('supplies'), getSupplies);

router.post('/:id/pay', protect, checkPermission('supplies'), payDebt);

router.route('/:id')
    .get(protect, checkPermission('supplies'), getSupplyById)
    .put(protect, checkPermission('supplies'), updateSupply)
    .delete(protect, checkPermission('supplies'), deleteSupply);

module.exports = router;
