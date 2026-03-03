const express = require('express');
const router = express.Router();
const { getBooks, getBookById, createBookReview, deleteBook, createBook, updateBook } = require('../controllers/bookController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/').get(getBooks).post(protect, checkPermission('books'), createBook);
router.route('/:id').get(getBookById).delete(protect, checkPermission('books'), deleteBook).put(protect, checkPermission('books'), updateBook);
router.route('/:id/reviews').post(protect, createBookReview);

module.exports = router;
