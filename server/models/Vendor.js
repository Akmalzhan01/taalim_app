const mongoose = require('mongoose');

const vendorSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: false,
    },
    totalSuppliedAmount: {
        type: Number,
        default: 0
    },
    totalSupplies: {
        type: Number,
        default: 0
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }
}, {
    timestamps: true
});

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
