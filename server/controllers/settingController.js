const asyncHandler = require('express-async-handler');
const SystemSetting = require('../models/SystemSetting');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Public (or Private depending on needs, but usually public for app config)
const getSettings = asyncHandler(async (req, res) => {
    let settings = await SystemSetting.findOne();

    if (!settings) {
        // Create default settings if none exist
        settings = await SystemSetting.create({});
    }

    res.json(settings);
});

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
    let settings = await SystemSetting.findOne();

    if (!settings) {
        settings = new SystemSetting();
    }

    if (req.body.receiptSettings) {
        settings.receiptSettings = {
            ...settings.receiptSettings,
            ...req.body.receiptSettings
        };
    }

    if (req.body.barcodePrinterSettings) {
        settings.barcodePrinterSettings = {
            ...settings.barcodePrinterSettings,
            ...req.body.barcodePrinterSettings
        };
    }

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
});

module.exports = {
    getSettings,
    updateSettings
};
