const express = require('express');
const router = express.Router();
const {
    getQuotes,
    createQuote,
    updateQuote,
    deleteQuote,
} = require('../controllers/quoteController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/').get(getQuotes).post(protect, checkPermission('quotes'), createQuote);
router.route('/:id').put(protect, checkPermission('quotes'), updateQuote).delete(protect, checkPermission('quotes'), deleteQuote);

module.exports = router;
