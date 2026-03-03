const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory, updateCategory } = require('../controllers/categoryController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(getCategories)
    .post(protect, checkPermission('categories'), createCategory);

router.route('/:id')
    .delete(protect, checkPermission('categories'), deleteCategory)
    .put(protect, checkPermission('categories'), updateCategory);

module.exports = router;
