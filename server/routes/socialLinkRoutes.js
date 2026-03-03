const express = require('express');
const router = express.Router();
const SocialLink = require('../models/SocialLink');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// @desc    Get all social links
// @route   GET /api/social-links
// @access  Public
router.get('/', async (req, res) => {
    try {
        const links = await SocialLink.find({ isActive: true });
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all social links (Admin)
// @route   GET /api/social-links/admin
// @access  Private/Admin
router.get('/admin', protect, checkPermission('links'), async (req, res) => {
    try {
        const links = await SocialLink.find({});
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a social link
// @route   POST /api/social-links
// @access  Private/Admin
router.post('/', protect, checkPermission('links'), async (req, res) => {
    const { platform, url, icon, isActive } = req.body;

    try {
        const link = new SocialLink({
            platform,
            url,
            icon,
            isActive
        });

        const createdLink = await link.save();
        res.status(201).json(createdLink);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a social link
// @route   PUT /api/social-links/:id
// @access  Private/Admin
router.put('/:id', protect, checkPermission('links'), async (req, res) => {
    const { platform, url, icon, isActive } = req.body;

    try {
        const link = await SocialLink.findById(req.params.id);

        if (link) {
            link.platform = platform || link.platform;
            link.url = url || link.url;
            link.icon = icon || link.icon;
            link.isActive = isActive !== undefined ? isActive : link.isActive;

            const updatedLink = await link.save();
            res.json(updatedLink);
        } else {
            res.status(404).json({ message: 'Social link not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a social link
// @route   DELETE /api/social-links/:id
// @access  Private/Admin
router.delete('/:id', protect, checkPermission('links'), async (req, res) => {
    try {
        const link = await SocialLink.findById(req.params.id);

        if (link) {
            await link.deleteOne();
            res.json({ message: 'Social link removed' });
        } else {
            res.status(404).json({ message: 'Social link not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
