const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/').get(getSettings).put(protect, checkPermission('settings'), updateSettings);

module.exports = router;
