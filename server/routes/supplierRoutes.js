const express = require('express');
const router = express.Router();
const {
    getSuppliers,
    createSupplier,
    updateSupplier,
    paySupplier,
    deleteSupplier,
} = require('../controllers/supplierController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getSuppliers)
    .post(protect, createSupplier);

router.route('/:id')
    .put(protect, updateSupplier)
    .delete(protect, admin, deleteSupplier);

router.route('/:id/pay')
    .post(protect, paySupplier);

module.exports = router;
