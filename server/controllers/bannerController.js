const asyncHandler = require('express-async-handler');
const Banner = require('../models/Banner');

// @desc    Fetch all banners
// @route   GET /api/banners
// @access  Public
const getBanners = asyncHandler(async (req, res) => {
    const banners = await Banner.find({ isActive: true });
    res.json(banners);
});

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
    const { title, subtitle, image, color, link } = req.body;

    const banner = new Banner({
        title,
        subtitle,
        image,
        color,
        link,
    });

    const createdBanner = await banner.save();
    res.status(201).json(createdBanner);
});

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
        await banner.deleteOne(); // or remove() for older mongoose
        res.json({ message: 'Banner removed' });
    } else {
        res.status(404);
        throw new Error('Banner not found');
    }
});

module.exports = {
    getBanners,
    createBanner,
    deleteBanner,
};
