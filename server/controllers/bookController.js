const Book = require('../models/Book');

// @desc    Fetch all books
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
    try {
        const books = await Book.find({});
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Fetch single book
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new review
// @route   POST /api/books/:id/reviews
// @access  Public (for now)
const createBookReview = async (req, res) => {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);

    if (book) {
        let alreadyReviewed = book.comments.find(
            (r) => r.user && r.user.toString() === req.user._id.toString()
        );

        // If not found by ID, try to find a legacy review by name (without user ID) to "claim" it
        if (!alreadyReviewed) {
            alreadyReviewed = book.comments.find(
                (r) => !r.user && r.name === req.user.name
            );
        }

        if (alreadyReviewed) {
            alreadyReviewed.rating = Number(rating);
            alreadyReviewed.comment = comment;
            alreadyReviewed.date = Date.now();
            if (!alreadyReviewed.user) {
                alreadyReviewed.user = req.user._id; // Claim the legacy review
            }
            alreadyReviewed.rating = Number(rating);
            alreadyReviewed.comment = comment;
            alreadyReviewed.date = Date.now(); // Update date

            // Recalculate rating
            book.rating =
                book.comments.reduce((acc, item) => item.rating + acc, 0) /
                book.comments.length;

            await book.save();
            return res.status(200).json({ message: 'Review updated' });
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        book.comments.push(review);
        book.numReviews = book.comments.length;

        book.rating =
            book.comments.reduce((acc, item) => item.rating + acc, 0) /
            book.comments.length;

        await book.save();
        res.status(201).json({ message: 'Review added' });
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
const deleteBook = async (req, res) => {
    const book = await Book.findById(req.params.id);

    if (book) {
        await book.deleteOne();
        res.json({ message: 'Book removed' });
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
};

// @desc    Create a book
// @route   POST /api/books
// @access  Private/Admin
const createBook = async (req, res) => {
    const { title, author, price, description, genres, image, summary, soldCount, isNew, size, coverType, ageLimit, countInStock, minStockLimit, costPrice, cashbackAmount } = req.body;

    const book = new Book({
        title,
        author,
        price,
        description,
        genres,
        image,
        summary,
        soldCount,
        isNew,
        size,
        coverType,
        ageLimit,
        countInStock: countInStock || 0,
        minStockLimit: minStockLimit || 5,
        costPrice: costPrice || 0,
        cashbackAmount: cashbackAmount || 0,
        numReviews: 0,
        rating: 0,
    });

    const createdBook = await book.save();
    res.status(201).json(createdBook);
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private/Admin
const updateBook = async (req, res) => {
    const { title, author, price, description, genres, image, summary, soldCount, isNew, size, coverType, ageLimit, countInStock, minStockLimit, costPrice } = req.body;

    const book = await Book.findById(req.params.id);

    if (book) {
        book.title = title || book.title;
        book.author = author || book.author;
        book.price = price || book.price;
        book.description = description || book.description;
        book.genres = genres || book.genres;
        book.image = image || book.image;
        book.summary = summary || book.summary;
        book.soldCount = soldCount || book.soldCount;
        book.isNew = isNew !== undefined ? isNew : book.isNew;
        book.size = size || book.size;
        book.coverType = coverType || book.coverType;
        book.ageLimit = ageLimit || book.ageLimit;
        book.countInStock = countInStock !== undefined ? countInStock : book.countInStock;
        book.minStockLimit = req.body.minStockLimit || book.minStockLimit;
        book.costPrice = req.body.costPrice || book.costPrice;
        book.cashbackAmount = req.body.cashbackAmount || book.cashbackAmount;

        const updatedBook = await book.save();
        res.json(updatedBook);
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
};

module.exports = {
    getBooks,
    getBookById,
    createBookReview,
    deleteBook,
    createBook,
    updateBook,
};
