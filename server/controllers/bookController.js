const Book = require('../models/Book');

// @desc    Fetch all books
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
    try {
        const query = {};

        // Filter by branch from query string (for superadmins/admins)
        if (req.query.branch) {
            query.branch = req.query.branch;
        }
        // Or filter by user's assigned branch (for managers/kassir)
        else if (req.user && req.user.branch) {
            query.branch = req.user.branch;
        }

        // Mobile clients (no showAll param) get only visible books
        if (!req.query.showAll) {
            query.isVisible = true;
        }

        if (req.query.search) {
            const escaped = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(escaped, 'i');
            query.$or = [{ title: pattern }, { author: pattern }, { barcode: pattern }];
        }

        // Barcode scanner lookup: exact barcode, or an id ending with the code
        if (req.query.code) {
            const escaped = String(req.query.code).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { barcode: new RegExp(`^${escaped}$`, 'i') },
                { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: `${escaped}$`, options: 'i' } } }
            ];
        }

        if (req.query.category && req.query.category !== 'all') {
            query.genres = req.query.category;
        }

        if (req.query.stock === 'in') {
            query.countInStock = { $gt: 0 };
        } else if (req.query.stock === 'out') {
            query.countInStock = { $lte: 0 };
        }

        // Callers that ask for a page get a page; everyone else (the mobile app)
        // keeps receiving the plain array they already expect.
        const wantsPage = req.query.page !== undefined || req.query.limit !== undefined;
        if (!wantsPage) {
            const books = await Book.find(query).populate('branch');
            return res.json(books);
        }

        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        // Paging needs a deterministic order; the POS grid wants stock first
        const sort = req.query.sort === 'stock'
            ? { countInStock: -1, title: 1 }
            : { createdAt: -1, _id: -1 };

        const total = await Book.countDocuments(query);
        const books = await Book.find(query)
            .populate('branch')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            books,
            page,
            pages: Math.max(Math.ceil(total / limit), 1),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Fetch single book
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('branch');

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
        // Permission check
        const isSuperAdmin = req.user && (req.user.role === 'superadmin' || req.user.isAdmin);
        if (!isSuperAdmin && book.branch.toString() !== req.user.branch.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete books in this branch' });
        }
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
    const { title, author, price, description, genres, image, summary, soldCount, isNew, size, coverType, ageLimit, barcode, countInStock, minStockLimit, costPrice, cashbackAmount, branch } = req.body;

    // Use branch from body or fall back to user's branch
    const bookBranch = branch || (req.user && req.user.branch);

    if (!bookBranch) {
        return res.status(400).json({ message: 'Branch is required' });
    }

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
        barcode,
        countInStock: countInStock || 0,
        minStockLimit: minStockLimit || 5,
        costPrice: costPrice || 0,
        cashbackAmount: cashbackAmount || 0,
        numReviews: 0,
        rating: 0,
        branch: bookBranch,
    });

    const createdBook = await book.save();
    await createdBook.populate('branch');
    res.status(201).json(createdBook);
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private/Admin
const updateBook = async (req, res) => {
    const { title, author, price, description, genres, image, summary, soldCount, isNew, isVisible, size, coverType, ageLimit, barcode, countInStock, minStockLimit, costPrice, branch } = req.body;

    const book = await Book.findById(req.params.id);
    console.log('updateBook called:', { bodyBranch: branch, userRole: req.user?.role, userIsAdmin: req.user?.isAdmin });

    if (book) {
        // Permission check: if not superadmin, must belong to user's branch
        const isSuperAdmin = req.user && (req.user.role === 'superadmin' || req.user.isAdmin);
        if (!isSuperAdmin && book.branch.toString() !== req.user.branch.toString()) {
            return res.status(403).json({ message: 'Not authorized to update books in this branch' });
        }

        book.title = title || book.title;
        book.author = author || book.author;
        book.price = price || book.price;
        book.description = description || book.description;
        book.genres = genres || book.genres;
        book.image = image || book.image;
        book.summary = summary || book.summary;
        book.soldCount = soldCount || book.soldCount;
        book.isNew = isNew !== undefined ? isNew : book.isNew;
        book.isVisible = isVisible !== undefined ? isVisible : book.isVisible;
        book.size = size || book.size;
        book.coverType = coverType || book.coverType;
        book.ageLimit = ageLimit || book.ageLimit;
        book.barcode = barcode || book.barcode;
        book.countInStock = countInStock !== undefined ? countInStock : book.countInStock;
        book.minStockLimit = req.body.minStockLimit || book.minStockLimit;
        // Sent explicitly, so 0 has to be accepted as "clear the cost price"
        book.costPrice = req.body.costPrice !== undefined ? req.body.costPrice : book.costPrice;
        book.cashbackAmount = req.body.cashbackAmount || book.cashbackAmount;

        // If user is superadmin/admin and branch is provided in request body, update it
        if (isSuperAdmin && branch !== undefined && branch !== '') {
            book.branch = branch;
        }

        const updatedBook = await book.save();
        await updatedBook.populate('branch');
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
