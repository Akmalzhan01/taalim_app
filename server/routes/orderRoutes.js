const express = require('express');
const router = express.Router();
const { addOrderItems, getMyOrders, getOrders, updateOrderToDelivered, getOrderById, getOrdersByUser, getDashboardStats, addOrderAdmin, refundOrder, getZReport } = require('../controllers/orderController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/admin').post(protect, checkPermission('pos'), addOrderAdmin);
router.post('/', protect, addOrderItems);
router.get('/', protect, checkPermission('orders'), getOrders);
router.route('/stats').get(protect, checkPermission('dashboard'), getDashboardStats);
router.route('/myorders').get(protect, getMyOrders);
router.route('/z-report').get(protect, checkPermission('reports'), getZReport);
router.route('/user/:userId').get(protect, checkPermission(['users', 'orders', 'pos']), getOrdersByUser);

// IMPORTANT: Routes with /:id parameter must be placed AFTER literal routes
router.route('/:id').get(protect, getOrderById);
router.route('/:id/deliver').put(protect, checkPermission('orders'), updateOrderToDelivered);
router.route('/:id/refund').put(protect, checkPermission('orders'), refundOrder);
module.exports = router;
