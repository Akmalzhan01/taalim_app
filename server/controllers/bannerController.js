const asyncHandler = require('express-async-handler');
const Banner = require('../models/Banner');

// @desc    Fetch all banners
// @route   GET /api/banners
// @access  Public
const getBanners = asyncHandler(async (req, res) => {
    let query = { isActive: true };
    if (req.query.all === 'true') {
        query = {};
    }
    const banners = await Banner.find(query);
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

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
        banner.title = req.body.title || banner.title;
        banner.subtitle = req.body.subtitle || banner.subtitle;
        banner.image = req.body.image || banner.image;
        banner.color = req.body.color || banner.color;
        banner.link = req.body.link !== undefined ? req.body.link : banner.link;
        if (req.body.isActive !== undefined) {
            banner.isActive = req.body.isActive;
        }

        const updatedBanner = await banner.save();
        res.json(updatedBanner);
    } else {
        res.status(404);
        throw new Error('Banner not found');
    }
});

module.exports = {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
};
