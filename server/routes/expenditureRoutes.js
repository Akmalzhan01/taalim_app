const express = require('express');
const router = express.Router();
const { getExpenditures, addExpenditure, deleteExpenditure, updateExpenditure } = require('../controllers/expenditureController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, checkPermission('expenses'), getExpenditures)
    .post(protect, checkPermission('expenses'), addExpenditure);

router.route('/:id')
    .put(protect, checkPermission('expenses'), updateExpenditure)
    .delete(protect, checkPermission('expenses'), deleteExpenditure);

module.exports = router;
