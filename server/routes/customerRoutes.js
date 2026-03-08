const express = require('express');
const router = express.Router();
const {
    getCustomers,
    searchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} = require('../controllers/customerController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCustomers)
    .post(protect, createCustomer);

router.route('/search/:phone')
    .get(protect, searchCustomer);

router.route('/:id')
    .put(protect, checkPermission('customers'), updateCustomer)
    .delete(protect, checkPermission('customers'), deleteCustomer);

module.exports = router;
