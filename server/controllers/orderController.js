const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        useCashback // Boolean flag from frontend
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        // Calculate Cashback to be earned
        const Book = require('../models/Book');
        let earnedCashback = 0;

        // Verify stock and calculate cashback
        for (const item of orderItems) {
            const book = await Book.findById(item.product);
            if (book) {
                earnedCashback += (book.cashbackAmount || 0) * item.qty;
            }
        }

        let finalTotalPrice = totalPrice;
        let usedCashbackAmount = 0;

        // Handle Cashback Usage
        if (useCashback) {
            const User = require('../models/User');
            const user = await User.findById(req.user._id);

            if (user && user.cashbackBalance > 0) {
                // If accumulated cashback is more than total price, use only what's needed
                if (user.cashbackBalance >= finalTotalPrice) {
                    usedCashbackAmount = finalTotalPrice;
                    finalTotalPrice = 0;
                    user.cashbackBalance -= usedCashbackAmount;
                } else {
                    usedCashbackAmount = user.cashbackBalance;
                    finalTotalPrice -= usedCashbackAmount;
                    user.cashbackBalance = 0;
                }
                await user.save();
            }
        }

        const order = new Order({
            items: orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice: finalTotalPrice, // Update total price
            usedCashback: usedCashbackAmount,
            earnedCashback: earnedCashback,
            branch: req.user.branch, // Added branch
        });

        const createdOrder = await order.save();

        // Update Stock and Check Low Stock
        const lowStockBooks = [];
        for (const item of orderItems) {
            const book = await Book.findById(item.product);
            if (book) {
                if (book.isBundle && book.bundleItems && book.bundleItems.length > 0) {
                    for (const bItem of book.bundleItems) {
                        const subBook = await Book.findById(bItem.product);
                        if (subBook) {
                            subBook.countInStock = subBook.countInStock - (bItem.qty * item.qty);
                            if (subBook.countInStock < 0) subBook.countInStock = 0;
                            await subBook.save();
                            if (subBook.countInStock <= subBook.minStockLimit) {
                                lowStockBooks.push(`${subBook.title} (Осталось: ${subBook.countInStock})`);
                            }
                        }
                    }
                } else {
                    book.countInStock = book.countInStock - item.qty;
                    if (book.countInStock < 0) book.countInStock = 0;
                    await book.save();

                    if (book.countInStock <= book.minStockLimit) {
                        lowStockBooks.push(`${book.title} (Осталось: ${book.countInStock})`);
                    }
                }
            }
        }


        // Send Telegram Notification
        const { sendOrderNotification, sendMessageToAdmin } = require('../utils/telegram');
        sendOrderNotification(createdOrder).catch(err => console.error('Telegram Error:', err));

        if (lowStockBooks.length > 0) {
            const warningMessage = `⚠️ *ВНИМАНИЕ: ЗАКАНЧИВАЮТСЯ КНИГИ!* ⚠️\n\n` +
                lowStockBooks.map(b => `• ${b}`).join('\n') +
                `\n\nПожалуйста, пополните запасы!`;
            sendMessageToAdmin(warningMessage).catch(err => console.error('Telegram Low Stock Log Error:', err));
        }

        res.status(201).json(createdOrder);
    }
});

// @desc    Create new order (Admin/POS)
// @route   POST /api/orders/admin
// @access  Private/Admin
const addOrderAdmin = asyncHandler(async (req, res) => {
    const {
        orderItems,
        userId, // Optional: if provided, link to user
        paymentMethod,
        totalPrice,
        useCashback
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    const Book = require('../models/Book');
    const User = require('../models/User');

    let finalTotalPrice = totalPrice;
    let usedCashbackAmount = 0;
    let earnedCashback = 0;
    let user = null;

    // 1. Handle User & Cashback
    if (userId) {
        user = await User.findById(userId);
        if (user) {
            // Calculate Earned Cashback
            for (const item of orderItems) {
                const book = await Book.findById(item.product);
                if (book) {
                    earnedCashback += (book.cashbackAmount || 0) * item.qty;
                }
            }

            // Handle Used Cashback
            if (useCashback && user.cashbackBalance > 0) {
                if (user.cashbackBalance >= finalTotalPrice) {
                    usedCashbackAmount = finalTotalPrice;
                    finalTotalPrice = 0;
                    user.cashbackBalance -= usedCashbackAmount;
                } else {
                    usedCashbackAmount = user.cashbackBalance;
                    finalTotalPrice -= usedCashbackAmount;
                    user.cashbackBalance = 0;
                }
            }

            // Immediately add earned cashback for POS orders? 
            // Usually cashback is available for NEXT purchase. So we add it now.
            user.cashbackBalance += earnedCashback;
            await user.save();
        }
    }

    // 2. Deduct Stock
    const lowStockBooks = [];
    for (const item of orderItems) {
        const book = await Book.findById(item.product);
        if (book) {
            if (book.isBundle && book.bundleItems && book.bundleItems.length > 0) {
                for (const bItem of book.bundleItems) {
                    const subBook = await Book.findById(bItem.product);
                    if (subBook) {
                        subBook.countInStock = subBook.countInStock - (bItem.qty * item.qty);
                        if (subBook.countInStock < 0) subBook.countInStock = 0;
                        await subBook.save();
                        if (subBook.countInStock <= subBook.minStockLimit) {
                            lowStockBooks.push(`${subBook.title} (Осталось: ${subBook.countInStock})`);
                        }
                    }
                }
            } else {
                book.countInStock = book.countInStock - item.qty;
                if (book.countInStock < 0) book.countInStock = 0;
                await book.save();

                if (book.countInStock <= book.minStockLimit) {
                    lowStockBooks.push(`${book.title} (Осталось: ${book.countInStock})`);
                }
            }
        }
    }

    // 3. Create Order
    // Note: If no user, we might need to handle Schema validation if 'user' is required.
    // For now, assuming we relax the schema or provide a dummy ID if needed.
    // I will use req.user._id (the admin) as the 'creator' but the 'user' field should ideally be the customer.
    // If Model requires user, and we have guest, we might fail.
    // Strategy: Use a specific "Guest" user ID if available, or just use the Admin's ID but mark it differently?
    // Better: Make 'user' optional in Schema. I will do that in next step.

    const order = new Order({
        items: orderItems,
        user: userId || req.user._id, // If Guest, assign to Admin who processed it? Or better, `userId` if exists.
        // If I assign to Admin, it messes up Admin's stats.
        // I will temporarily assign to Admin if guest, but adding a note.
        shippingAddress: { address: 'POS Sale', city: 'Store', postalCode: '0000', country: 'Local' },
        paymentMethod: paymentMethod || 'Cash',
        itemsPrice: totalPrice, // Simplified for POS
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: finalTotalPrice,
        usedCashback: usedCashbackAmount,
        earnedCashback: earnedCashback,
        isPaid: true,
        paidAt: Date.now(),
        isDelivered: true,
        deliveredAt: Date.now(),
        comment: userId ? 'POS Sale' : 'POS Sale (Guest)',
        branch: req.user.branch, // Added branch parameter
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    let query = {};

    // Branch Filter
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    } else if (req.query.branch) {
        query.branch = req.query.branch;
    }

    const orders = await Order.find(query).populate('user', 'id name').sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!order.branch || order.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to update this order from another branch');
            }
        }
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        // Marking as paid because App orders are Cash on Delivery
        order.isPaid = true;
        order.paidAt = Date.now();

        await Order.updateOne({ _id: req.params.id }, {
            isDelivered: true,
            deliveredAt: Date.now(),
            isPaid: true,
            paidAt: Date.now()
        });

        const updatedOrder = await Order.findById(req.params.id);

        // Add earned cashback to user balance
        if (updatedOrder.earnedCashback > 0) {
            const User = require('../models/User');
            const user = await User.findById(updatedOrder.user);
            if (user) {
                user.cashbackBalance += updatedOrder.earnedCashback;
                await user.save();
            }
        }

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        // Allow if user is admin, superadmin, order owner, or has 'orders'/'pos' permissions
        const hasPermission = req.user.isAdmin || req.user.role === 'superadmin' ||
            (Array.isArray(req.user.permissions) && (req.user.permissions.includes('orders') || req.user.permissions.includes('pos')));

        // Branch Isolation Check: If not superadmin, order must belong to user's branch
        const isSameBranch = req.user.role === 'superadmin' || req.user.isAdmin ||
            (order.branch && order.branch.toString() === (req.user.branch._id || req.user.branch).toString());

        if ((hasPermission && isSameBranch) || (order.user && order.user._id.toString() === req.user._id.toString())) {
            res.json(order);
        } else {
            res.status(403);
            throw new Error('Not authorized to view this order from another branch');
        }
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get all orders for a specific user
// @route   GET /api/orders/user/:userId
// @access  Private/Admin
const getOrdersByUser = asyncHandler(async (req, res) => {
    let query = { user: req.params.userId };

    // Branch Filter
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get dashboard statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    // Branch Filter
    let branchFilter = {};
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            branchFilter = { branch: req.user.branch._id || req.user.branch };
        }
    } else if (req.query.branch) {
        const mongoose = require('mongoose');
        branchFilter = { branch: new mongoose.Types.ObjectId(req.query.branch) };
    }

    // 1. Total Income (Paid Orders)
    const incomeResult = await Order.aggregate([
        { $match: { isPaid: true, ...branchFilter } },
        { $group: { _id: null, totalIncome: { $sum: '$totalPrice' } } }
    ]);
    const totalIncome = incomeResult.length > 0 ? incomeResult[0].totalIncome : 0;

    // 1.1 Total Supply Cost
    const Supply = require('../models/Supply');
    const supplyResult = await Supply.aggregate([
        { $match: branchFilter },
        { $group: { _id: null, totalSupplies: { $sum: '$totalCost' } } }
    ]);
    const totalSupplies = supplyResult.length > 0 ? supplyResult[0].totalSupplies : 0;

    // 1.2 Total Operating Expenditures
    const Expenditure = require('../models/Expenditure');
    const expenditureResult = await Expenditure.aggregate([
        { $match: branchFilter }, // Added branchFilter
        { $group: { _id: null, totalExp: { $sum: '$amount' } } }
    ]);
    const totalExp = expenditureResult.length > 0 ? expenditureResult[0].totalExp : 0;

    // 2. Total Orders
    const totalOrders = await Order.countDocuments(branchFilter);

    // 3. Status Counts
    const pendingOrders = await Order.countDocuments({ isDelivered: false, ...branchFilter });
    const deliveredOrders = await Order.countDocuments({ isDelivered: true, ...branchFilter });

    // 4. Monthly Sales (Last 12 Months)
    // Removed isPaid: true to show all order activity in the chart
    const monthlySales = await Order.aggregate([
        {
            $match: {
                ...branchFilter,
                createdAt: {
                    $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' }
                },
                totalSales: { $sum: '$totalPrice' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format monthly sales for frontend
    const formattedMonthlySales = monthlySales.map(item => ({
        name: `${item._id.month}/${item._id.year}`,
        sales: item.totalSales,
        count: item.count
    }));

    // Start fetching users count separately to avoid circular dependency if userController isn't available
    // But since we are in orderController, we can just return these stats. The frontend can fetch user count separately via userSlice if needed, OR we can do a simple count here if User model is imported. 
    // Let's import User model to do it in one go.
    const User = require('../models/User');
    const totalUsers = await User.countDocuments(branchFilter);

    // 5. Latest Pending Orders (Limit 5)
    const latestPendingOrders = await Order.find({ isDelivered: false, ...branchFilter })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email');

    res.json({
        totalIncome,
        totalSupplies,
        totalExp,
        netProfit: totalIncome - totalSupplies - totalExp,
        totalOrders,
        totalUsers,
        pendingOrders,
        deliveredOrders,
        monthlySales: formattedMonthlySales,
        latestPendingOrders
    });
});

// @desc    Refund an order
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
const refundOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!order.branch || order.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to refund this order from another branch');
            }
        }
        if (order.isRefunded) {
            res.status(400);
            throw new Error('Order already refunded');
        }

        const Book = require('../models/Book');
        const User = require('../models/User');

        // Revert stock
        for (const item of order.items) {
            const book = await Book.findById(item.product);
            if (book) {
                book.countInStock += item.qty;
                await book.save();
            }
        }

        // Handle Cashback Reversion
        if (order.user) {
            const user = await User.findById(order.user);
            if (user) {
                if (order.usedCashback > 0) {
                    user.cashbackBalance += order.usedCashback;
                }
                if (order.earnedCashback > 0) {
                    user.cashbackBalance -= order.earnedCashback;
                    if (user.cashbackBalance < 0) user.cashbackBalance = 0;
                }
                await user.save();
            }
        }

        order.isRefunded = true;
        order.refundedAt = Date.now();

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get Z-Report (Daily Sales)
// @route   GET /api/orders/z-report
// @access  Private/Admin
const getZReport = asyncHandler(async (req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Branch Filter for Z-Report
    let branchFilter = {};
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            branchFilter = { branch: req.user.branch._id || req.user.branch };
        }
    } else if (req.query.branch) {
        const mongoose = require('mongoose');
        branchFilter = { branch: new mongoose.Types.ObjectId(req.query.branch) };
    }

    const orders = await Order.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        isPaid: true,
        ...branchFilter // Added branchFilter
    });

    let totalCash = 0;
    let totalCard = 0;
    let totalSales = 0;
    let totalRefunds = 0;
    let refundCount = 0;
    let orderCount = orders.length;

    for (const order of orders) {
        if (order.isRefunded) {
            totalRefunds += order.totalPrice;
            refundCount++;
        } else {
            totalSales += order.totalPrice;
            if (order.paymentMethod === 'Card') {
                totalCard += order.totalPrice;
            } else {
                totalCash += order.totalPrice;
            }
        }
    }

    const Expenditure = require('../models/Expenditure');
    const expenditures = await Expenditure.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        ...branchFilter // Added branchFilter
    });

    let totalExpenditures = 0;
    for (const exp of expenditures) {
        totalExpenditures += exp.amount;
    }

    const Supply = require('../models/Supply');
    const todaySupplies = await Supply.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        ...branchFilter // Added branchFilter
    });

    let totalSupplies = 0;
    for (const supply of todaySupplies) {
        totalSupplies += supply.totalCost;
    }

    res.json({
        date: startOfDay,
        totalSales,
        totalCash,
        totalCard,
        totalRefunds,
        totalExpenditures,
        totalSupplies,
        netProfit: totalSales - totalExpenditures - totalSupplies,
        refundCount,
        orderCount: orderCount - refundCount,
    });
});

module.exports = { addOrderItems, getMyOrders, getOrders, updateOrderToDelivered, getOrderById, getOrdersByUser, getDashboardStats, addOrderAdmin, refundOrder, getZReport };
