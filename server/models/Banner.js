const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    image: { type: String, required: true },
    color: { type: String, required: true, default: '#3B82F6' }, // Default blue
    link: { type: String }, // Optional deep link or external URL
    isActive: { type: Boolean, required: true, default: true },
}, {
    timestamps: true,
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
