const express = require('express');
const router = express.Router();
const { getBanners, createBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(getBanners)
    .post(protect, checkPermission('banners'), createBanner);

router.route('/:id')
    .delete(protect, checkPermission('banners'), deleteBanner);

module.exports = router;
