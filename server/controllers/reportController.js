const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Expenditure = require('../models/Expenditure');
const Book = require('../models/Book');
const Supply = require('../models/Supply');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    let dateFilter = {};
    if (req.query.startDate && req.query.endDate) {
        // Set end date to end of day
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter = {
            createdAt: {
                $gte: new Date(req.query.startDate),
                $lte: endDate
            }
        };
    }

    // Branch Filter
    let branchFilter = {};
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            branchFilter = { branch: req.user.branch._id || req.user.branch };
        }
    } else if (req.query.branch) {
        branchFilter = { branch: req.query.branch };
    }

    const finalFilter = { ...dateFilter, ...branchFilter };

    // 1. Total Revenue, Net Profit, Total Refunds, Cashback Issued
    const orders = await Order.find({ isPaid: true, ...finalFilter });

    let totalRevenue = 0;
    let posRevenue = 0;
    let mobileRevenue = 0;
    let totalRefunds = 0;
    let totalCashbackIssued = 0;
    let totalCashbackUsed = 0;
    let booksSold = 0;
    let totalCOGS = 0;

    // Need to fetch full books for COGS
    const booksInDB = await Book.find().select('_id costPrice');
    const costMap = {};
    booksInDB.forEach(b => {
        costMap[b._id.toString()] = b.costPrice || 0;
    });

    orders.forEach(order => {
        if (order.isRefunded) {
            totalRefunds += order.totalPrice;
        } else {
            totalRevenue += order.totalPrice;
            totalCashbackIssued += (order.earnedCashback || 0);
            totalCashbackUsed += (order.usedCashback || 0);

            // Check POS vs Mobile
            if (order.shippingAddress && order.shippingAddress.address === 'POS Sale') {
                posRevenue += order.totalPrice;
            } else {
                mobileRevenue += order.totalPrice;
            }

            order.items.forEach(item => {
                booksSold += item.qty;
                const cost = costMap[item.product.toString()] || 0;
                totalCOGS += (cost * item.qty);
            });
        }
    });

    // 2. Expenditures
    const expenditures = await Expenditure.find(finalFilter);
    const totalExpenditures = expenditures.reduce((acc, exp) => acc + exp.amount, 0);

    // 3. Supplies (New)
    const supplies = await Supply.find(finalFilter);
    const totalSupplies = supplies.reduce((acc, sup) => acc + sup.totalCost, 0);

    // Net Profit Calculation (Revenue - COGS - Expenditures - Supplies - Cashback Used - Refunds are already not in Revenue)
    // Net Profit Calculation (Revenue - Expenditures - Supplies - Cashback Used - Refunds are already not in Revenue)
    const netProfit = totalRevenue - totalExpenditures - totalSupplies - totalCashbackUsed;

    res.json({
        totalRevenue,
        posRevenue,
        mobileRevenue,
        totalCOGS,
        netProfit,
        totalRefunds,
        totalExpenditures,
        totalSupplies,
        totalCashbackIssued,
        totalCashbackUsed,
        booksSold,
        totalOrders: orders.length
    });
});

// @desc    Get top selling books
// @route   GET /api/reports/top-books
// @access  Private/Admin
const getTopBooks = asyncHandler(async (req, res) => {
    let topBooks = [];
    let leastBooks = [];

    // Branch Filter Setup
    let branchFilter = {};
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            branchFilter = { branch: req.user.branch._id || req.user.branch };
        }
    } else if (req.query.branch) {
        branchFilter = { branch: req.query.branch };
    }

    let matchCondition = { isPaid: true, ...branchFilter };

    if (req.query.startDate && req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date(req.query.startDate);
        matchCondition.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Fetch sold counts per book
    const soldData = await Order.aggregate([
        { $match: matchCondition },
        { $unwind: "$items" },
        { $group: { _id: "$items.product", soldCount: { $sum: "$items.qty" } } }
    ]);

    const soldMap = {};
    soldData.forEach(item => {
        soldMap[item._id.toString()] = item.soldCount;
    });

    // Get all books to calculate who sold the most and least (including 0 sales)
    const allBooksQuery = await Book.find().select('title author image price');
    let allBooks = allBooksQuery.map(book => ({
        _id: book._id,
        title: book.title,
        author: book.author || 'Неизвестный автор',
        image: book.image,
        price: book.price,
        soldCount: soldMap[book._id.toString()] || 0
    }));

    // Sort descending for top books
    allBooks.sort((a, b) => b.soldCount - a.soldCount);
    topBooks = allBooks.slice(0, 10);

    // Sort ascending for least selling books
    allBooks.sort((a, b) => a.soldCount - b.soldCount);
    leastBooks = allBooks.slice(0, 10);

    return res.json({ topBooks, leastBooks });
});

// @desc    Get Sales Chart Data (Grouped by Date)
// @route   GET /api/reports/sales-chart
// @access  Private/Admin
const getSalesChartData = asyncHandler(async (req, res) => {
    let dateFilter = {};
    let groupByMonth = false;

    if (req.query.startDate && req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date(req.query.startDate);
        dateFilter = {
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        };
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 60) groupByMonth = true;
    } else {
        // We will group sales by day for the last 30 days by default
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    }

    // Branch Filter Setup
    let branchFilter = {};
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            branchFilter = { branch: req.user.branch._id || req.user.branch };
        }
    } else if (req.query.branch) {
        branchFilter = { branch: req.query.branch };
    }

    const orders = await Order.find({
        isPaid: true,
        ...dateFilter,
        ...branchFilter
    }).sort('createdAt');

    const booksInDB = await Book.find().select('_id costPrice');
    const costMap = {};
    booksInDB.forEach(b => {
        costMap[b._id.toString()] = b.costPrice || 0;
    });

    const posSalesByDate = {};
    const mobileSalesByDate = {};
    const refundsByDate = {};
    const cogsByDate = {};
    const cashbackUsedByDate = {};

    orders.forEach(order => {
        const dateString = groupByMonth
            ? order.createdAt.toISOString().substring(0, 7) // YYYY-MM
            : order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!posSalesByDate[dateString]) posSalesByDate[dateString] = 0;
        if (!mobileSalesByDate[dateString]) mobileSalesByDate[dateString] = 0;
        if (!refundsByDate[dateString]) refundsByDate[dateString] = 0;
        if (!cogsByDate[dateString]) cogsByDate[dateString] = 0;
        if (!cashbackUsedByDate[dateString]) cashbackUsedByDate[dateString] = 0;

        if (order.isRefunded) {
            refundsByDate[dateString] += order.totalPrice;
        } else {
            if (order.shippingAddress && order.shippingAddress.address === 'POS Sale') {
                posSalesByDate[dateString] += order.totalPrice;
            } else {
                mobileSalesByDate[dateString] += order.totalPrice;
            }

            cashbackUsedByDate[dateString] += (order.usedCashback || 0);

            order.items.forEach(item => {
                const cost = costMap[item.product.toString()] || 0;
                cogsByDate[dateString] += (cost * item.qty);
            });
        }
    });

    const expenditures = await Expenditure.find({ ...dateFilter, ...branchFilter });

    const expByDate = {};
    expenditures.forEach(exp => {
        const dateString = groupByMonth
            ? exp.createdAt.toISOString().substring(0, 7)
            : exp.createdAt.toISOString().split('T')[0];
        if (!expByDate[dateString]) expByDate[dateString] = 0;
        expByDate[dateString] += exp.amount;
    });

    const supplies = await Supply.find({ ...dateFilter, ...branchFilter });
    const suppliesByDate = {};
    supplies.forEach(sup => {
        const dateString = groupByMonth
            ? sup.date.toISOString().substring(0, 7)
            : sup.date.toISOString().split('T')[0];
        if (!suppliesByDate[dateString]) suppliesByDate[dateString] = 0;
        suppliesByDate[dateString] += sup.totalCost;
    });

    // Formatting for Recharts
    const chartData = [];
    const dates = new Set([
        ...Object.keys(posSalesByDate),
        ...Object.keys(mobileSalesByDate),
        ...Object.keys(refundsByDate),
        ...Object.keys(expByDate),
        ...Object.keys(cogsByDate)
    ]);

    const sortedDates = Array.from(dates).sort();

    sortedDates.forEach(date => {
        const posSales = posSalesByDate[date] || 0;
        const mobileSales = mobileSalesByDate[date] || 0;
        const totalSales = posSales + mobileSales;
        const refunds = refundsByDate[date] || 0;
        const exp = expByDate[date] || 0;
        const supplies = suppliesByDate[date] || 0;
        const cogs = cogsByDate[date] || 0;
        const cashbackUsed = cashbackUsedByDate[date] || 0;

        // Net Profit Calculation for each date point (Revenue - Supplies - Expenses - Cashback)
        const net = totalSales - supplies - exp - cashbackUsed;

        chartData.push({
            date,
            POS_Продажи: posSales,
            Mobile_Продажи: mobileSales,
            Общие_Продажи: totalSales,
            Возвраты: refunds,
            Расходы: exp,
            Закуп_Книг: supplies,
            Себестоимость: cogs,
            Чистая_Прибыль: net
        });
    });

    res.json(chartData);
});
// @desc    Get Detailed Book Sales by Date
// @route   GET /api/reports/sales-by-date
// @access  Private/Admin
const getSalesByDate = asyncHandler(async (req, res) => {
    const { date } = req.query;

    if (!date) {
        res.status(400);
        throw new Error('Please provide a date parameter (YYYY-MM-DD or YYYY-MM)');
    }

    let startDate, endDate;

    // Determine if date is day (YYYY-MM-DD) or month (YYYY-MM)
    if (date.length === 10) {
        // Daily
        startDate = new Date(date);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
    } else if (date.length === 7) {
        // Monthly
        const [year, month] = date.split('-');
        startDate = new Date(year, parseInt(month) - 1, 1);
        endDate = new Date(year, parseInt(month), 0);
        endDate.setHours(23, 59, 59, 999);
    } else {
        res.status(400);
        throw new Error('Invalid date format');
    }

    // Branch Filter Setup
    let branchFilter = {};
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            branchFilter = { branch: req.user.branch._id || req.user.branch };
        }
    } else if (req.query.branch) {
        branchFilter = { branch: req.query.branch };
    }

    const orders = await Order.find({
        isPaid: true,
        isRefunded: { $ne: true },
        ...branchFilter,
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    })
        .populate('user', 'name')
        .populate('items.product', 'title author costPrice');

    // Return the full orders, sorted newest first
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(sortedOrders);
});

module.exports = {
    getDashboardStats,
    getTopBooks,
    getSalesChartData,
    getSalesByDate
};
