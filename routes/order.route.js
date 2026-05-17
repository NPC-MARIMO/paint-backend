const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, getOrderById, updateOrderStatus, getDashboardStats, deleteOrder, getUserOrders } = require('../controllers/order.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

// Public / auth routes
router.post('/', createOrder);
router.get('/stats', authMiddleware, adminMiddleware, getDashboardStats);
router.get('/', authMiddleware, adminMiddleware, getAllOrders);
router.get('/my-orders', authMiddleware, getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);
router.delete('/:id', authMiddleware, adminMiddleware, deleteOrder);

module.exports = router;
