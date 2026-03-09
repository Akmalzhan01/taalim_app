const express = require('express');
const router = express.Router();
const {
    getSuppliers,
    createSupplier,
    updateSupplier,
    paySupplier,
} = require('../controllers/supplierController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getSuppliers)
    .post(protect, createSupplier);

router.route('/:id')
    .put(protect, updateSupplier);

router.route('/:id/pay')
    .post(protect, paySupplier);

module.exports = router;
