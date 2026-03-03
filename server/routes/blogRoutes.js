const express = require('express');
const router = express.Router();
const {
    getBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    likeBlog,
} = require('../controllers/blogController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/').get(getBlogs).post(protect, checkPermission('blogs'), createBlog);
router.route('/:id')
    .get(getBlogById)
    .put(protect, checkPermission('blogs'), updateBlog)
    .delete(protect, checkPermission('blogs'), deleteBlog);

router.route('/:id/like').put(likeBlog);

module.exports = router;
