const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(getBanners)
    .post(protect, checkPermission('banners'), createBanner);

router.route('/:id')
    .put(protect, checkPermission('banners'), updateBanner)
    .delete(protect, checkPermission('banners'), deleteBanner);

module.exports = router;
