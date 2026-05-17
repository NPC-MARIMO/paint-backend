const Cart = require('../model/cart.model');

// GET user's cart
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        if (!cart) {
            cart = { items: [] };
        }
        res.status(200).json({ cart });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching cart', error: err.message });
    }
};

// POST add item to cart
const addToCart = async (req, res) => {
    try {
        const { productId, quantity, selectedColor } = req.body;

        if (!productId || !selectedColor) {
            return res.status(400).json({ message: 'Product ID and color are required' });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: [{ product: productId, quantity: quantity || 1, selectedColor }]
            });
        } else {
            const existingItem = cart.items.find(
                item => item.product.toString() === productId && item.selectedColor === selectedColor
            );

            if (existingItem) {
                existingItem.quantity += (quantity || 1);
            } else {
                cart.items.push({ product: productId, quantity: quantity || 1, selectedColor });
            }

            await cart.save();
        }

        cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        res.status(200).json({ message: 'Item added to cart', cart });
    } catch (err) {
        res.status(500).json({ message: 'Error adding to cart', error: err.message });
    }
};

// PUT update cart item quantity
const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        if (quantity <= 0) {
            cart.items.pull({ _id: req.params.itemId });
        } else {
            item.quantity = quantity;
        }

        await cart.save();
        const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        res.status(200).json({ message: 'Cart updated', cart: updatedCart });
    } catch (err) {
        res.status(500).json({ message: 'Error updating cart', error: err.message });
    }
};

// DELETE remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items.pull({ _id: req.params.itemId });
        await cart.save();

        const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        res.status(200).json({ message: 'Item removed from cart', cart: updatedCart });
    } catch (err) {
        res.status(500).json({ message: 'Error removing from cart', error: err.message });
    }
};

// DELETE clear entire cart
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.status(200).json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ message: 'Error clearing cart', error: err.message });
    }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
