const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    res.json(blogs);
});

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);

    if (blog) {
        // Increment views on fetch
        blog.views = (blog.views || 0) + 1;
        await blog.save();
        res.json(blog);
    } else {
        res.status(404);
        throw new Error('Blog not found');
    }
});

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private/Admin
const createBlog = asyncHandler(async (req, res) => {
    const { title, description, image, link } = req.body;

    if (!title || !description || !image) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    const blog = await Blog.create({
        title,
        description,
        image,
        link,
    });

    res.status(201).json(blog);
});

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
const updateBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.json(updatedBlog);
});

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
const deleteBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    await blog.deleteOne();

    res.json({ id: req.params.id });
});

// @desc    Like a blog
// @route   PUT /api/blogs/:id/like
// @access  Public
const likeBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);

    if (blog) {
        blog.likes = (blog.likes || 0) + 1;
        const updatedBlog = await blog.save();
        res.json(updatedBlog);
    } else {
        res.status(404);
        throw new Error('Blog not found');
    }
});

module.exports = {
    getBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    likeBlog,
};
