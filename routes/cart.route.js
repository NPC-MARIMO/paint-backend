const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// All cart routes require authentication
router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCart);
router.put('/:itemId', authMiddleware, updateCartItem);
router.delete('/clear', authMiddleware, clearCart);
router.delete('/:itemId', authMiddleware, removeFromCart);

module.exports = router;
