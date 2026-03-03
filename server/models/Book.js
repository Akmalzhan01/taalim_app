const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now },
});

const bookSchema = mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true }, // Short description
    summary: { type: String, required: true }, // Long reading content
    price: { type: Number, required: true },
    image: { type: String, required: true },
    genres: [String],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    soldCount: { type: Number, required: true, default: 0 },
    isNew: { type: Boolean, default: false },
    size: { type: String },
    coverType: { type: String },
    ageLimit: { type: String },
    branchStock: [
        {
            branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
            countInStock: { type: Number, required: true, default: 0 },
            minStockLimit: { type: Number, default: 5 },
        }
    ],
    countInStock: { type: Number, required: true, default: 0 }, // Total across all branches or legacy
    minStockLimit: { type: Number, default: 5 },
    costPrice: { type: Number, default: 0 },
    cashbackAmount: { type: Number, default: 0 },
    isBundle: { type: Boolean, default: false },
    bundleItems: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
        qty: { type: Number, required: true }
    }],
    comments: [commentSchema],
}, {
    timestamps: true,
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
