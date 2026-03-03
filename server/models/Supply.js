const mongoose = require('mongoose');

const supplySchema = mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: 'Book',
                },
                purchasePrice: {
                    type: Number,
                    required: true,
                    default: 0,
                },
                qty: {
                    type: Number,
                    required: true,
                    default: 1,
                },
            },
        ],
        totalCost: {
            type: Number,
            required: true,
            default: 0,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const Supply = mongoose.model('Supply', supplySchema);

module.exports = Supply;
