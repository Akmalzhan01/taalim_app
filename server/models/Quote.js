const mongoose = require('mongoose');

const quoteSchema = mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Please add a quote text'],
        },
        author: {
            type: String,
            required: [true, 'Please add an author'],
        },
        category: {
            type: String,
            default: 'General',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Quote', quoteSchema);
