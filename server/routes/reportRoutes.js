const express = require('express');
const router = express.Router();
const { getDashboardStats, getTopBooks, getSalesChartData, getSalesByDate } = require('../controllers/reportController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/dashboard').get(protect, checkPermission('reports'), getDashboardStats);
router.route('/top-books').get(protect, checkPermission('reports'), getTopBooks);
router.route('/sales-chart').get(protect, checkPermission('reports'), getSalesChartData);
router.route('/sales-by-date').get(protect, checkPermission('reports'), getSalesByDate);

module.exports = router;
