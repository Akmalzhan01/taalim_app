const mongoose = require('mongoose');

const supplyBatchSchema = mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Book',
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Branch',
        },
        costPrice: {
            type: Number,
            required: true,
            default: 0,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
        },
        initialQuantity: {
            type: Number,
            required: true,
            default: 0,
        },
        dateReceived: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster FIFO lookups
supplyBatchSchema.index({ book: 1, branch: 1, quantity: 1, dateReceived: 1 });

const SupplyBatch = mongoose.model('SupplyBatch', supplyBatchSchema);

module.exports = SupplyBatch;
