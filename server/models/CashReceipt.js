const mongoose = require('mongoose');

const cashReceiptSchema = mongoose.Schema({
    donorName: {
        type: String,
        required: [true, 'Имя отправителя обязательно'],
    },
    donorPhone: {
        type: String,
        default: '',
    },
    amount: {
        type: Number,
        required: [true, 'Сумма обязательна'],
    },
    description: {
        type: String,
        default: '',
    },
    date: {
        type: Date,
        default: Date.now,
    },
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

const CashReceipt = mongoose.model('CashReceipt', cashReceiptSchema);
module.exports = CashReceipt;
