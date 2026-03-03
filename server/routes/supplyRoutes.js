const express = require('express');
const router = express.Router();
const {
    addSupply,
    getSupplies,
    getSupplyById,
    deleteSupply
} = require('../controllers/supplyController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, checkPermission('supplies'), addSupply)
    .get(protect, checkPermission('supplies'), getSupplies);

router.route('/:id')
    .get(protect, checkPermission('supplies'), getSupplyById)
    .delete(protect, checkPermission('supplies'), deleteSupply);

module.exports = router;
