const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    user: {
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
            title: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book',
                required: true,
            },
        },
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: false },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        location: {
            lat: Number,
            lng: Number,
        }
    },
    paymentMethod: { type: String, required: true },
    usedCashback: { type: Number, default: 0 },
    earnedCashback: { type: Number, default: 0 },
    paymentResult: { // from payment gateway
        id: String,
        status: String,
        update_time: String,
        email_address: String,
    },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    isRefunded: { type: Boolean, required: true, default: false },
    refundedAt: { type: Date },
    comment: { type: String }, // User's custom note
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
