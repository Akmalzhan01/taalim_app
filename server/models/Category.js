const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    icon: { type: String, required: true }, // Lucide icon name or Ionicons name
    color: { type: String, required: true, default: '#3B82F6' },
}, {
    timestamps: true,
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
