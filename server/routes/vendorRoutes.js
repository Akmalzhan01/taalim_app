const express = require('express');
const router = express.Router();
const {
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor,
} = require('../controllers/vendorController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, checkPermission('supplies'), getVendors)
    .post(protect, checkPermission('supplies'), createVendor);

router.route('/:id')
    .put(protect, checkPermission('supplies'), updateVendor)
    .delete(protect, checkPermission('supplies'), deleteVendor);

module.exports = router;
