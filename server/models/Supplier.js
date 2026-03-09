const mongoose = require('mongoose');

const supplierSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: false,
        },
        totalSuppliedAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        totalPaidAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        paymentHistory: [
            {
                amount: { type: Number, required: true },
                comment: { type: String, default: '' },
                date: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: true,
    }
);

// Virtual field to calculate current debt
supplierSchema.virtual('currentDebt').get(function () {
    return this.totalSuppliedAmount - this.totalPaidAmount;
});

// Ensure virtuals are included in JSON and Object conversion
supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
