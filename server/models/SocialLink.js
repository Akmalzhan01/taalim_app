const mongoose = require('mongoose');

const socialLinkSchema = mongoose.Schema({
    platform: {
        type: String,
        required: true,
        enum: ['Instagram', 'Facebook', 'Telegram', 'Youtube', 'Twitter', 'LinkedIn', 'Website', 'Other'],
        default: 'Other'
    },
    url: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: true,
        // Using ionic icon names like 'logo-instagram', 'logo-facebook', etc.
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('SocialLink', socialLinkSchema);
