const mongoose = require('mongoose');

const paymentHistorySchema = mongoose.Schema({
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const debtSchema = mongoose.Schema({
    creditorName: {
        type: String,
        required: [true, 'Kreditor ismi kiritilishi shart'],
    },
    creditorPhone: {
        type: String,
        default: '',
    },
    amount: {
        type: Number,
        required: [true, 'Qarz miqdori kiritilishi shart'],
    },
    paidAmount: {
        type: Number,
        default: 0,
    },
    debtAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'paid'],
        default: 'active',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
        default: '',
    },
    paymentHistory: [paymentHistorySchema],
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const Debt = mongoose.model('Debt', debtSchema);
module.exports = Debt;
