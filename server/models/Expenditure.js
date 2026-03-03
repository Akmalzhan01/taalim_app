const mongoose = require('mongoose');

const expenditureSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title for the expenditure'],
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    category: {
        type: String,
        default: 'Other',
    },
    description: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Branch',
    },
}, {
    timestamps: true,
});

const Expenditure = mongoose.model('Expenditure', expenditureSchema);
module.exports = Expenditure;
