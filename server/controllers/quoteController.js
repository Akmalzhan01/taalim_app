const asyncHandler = require('express-async-handler');
const Quote = require('../models/Quote');

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Public
const getQuotes = asyncHandler(async (req, res) => {
    const quotes = await Quote.find({}).sort({ createdAt: -1 });
    res.json(quotes);
});

// @desc    Create a quote
// @route   POST /api/quotes
// @access  Private/Admin
const createQuote = asyncHandler(async (req, res) => {
    const { text, author, category } = req.body;

    if (!text || !author) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const quote = await Quote.create({
        text,
        author,
        category,
    });

    res.status(201).json(quote);
});

// @desc    Update a quote
// @route   PUT /api/quotes/:id
// @access  Private/Admin
const updateQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
        res.status(404);
        throw new Error('Quote not found');
    }

    const updatedQuote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.json(updatedQuote);
});

// @desc    Delete a quote
// @route   DELETE /api/quotes/:id
// @access  Private/Admin
const deleteQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
        res.status(404);
        throw new Error('Quote not found');
    }

    await quote.deleteOne();

    res.json({ id: req.params.id });
});

module.exports = {
    getQuotes,
    createQuote,
    updateQuote,
    deleteQuote,
};
