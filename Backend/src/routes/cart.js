const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { Cart, Product } = req.app.locals.models;
    
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'images', 'stockQuantity', 'isActive']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Filter out items with inactive products
    const activeCartItems = cartItems.filter(item => item.Product.isActive);

    // Calculate totals
    const subtotal = activeCartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);

    const totalItems = activeCartItems.reduce((total, item) => total + item.quantity, 0);

    res.json({
      success: true,
      data: {
        cartItems: activeCartItems,
        summary: {
          totalItems,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat((subtotal * 0.1).toFixed(2)), // 10% tax
          total: parseFloat((subtotal * 1.1).toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching cart'
    });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
router.post('/', authenticate, [
  body('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { productId, quantity = 1 } = req.body;
    const { Cart, Product } = req.app.locals.models;

    // Check if product exists and is active
    const product = await Product.findOne({
      where: { id: productId, isActive: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or inactive'
      });
    }

    // Check stock availability
    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock available'
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await Cart.findOne({
      where: { userId: req.user.id, productId }
    });

    let cartItem;

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (product.stockQuantity < newQuantity) {
        return res.status(400).json({
          success: false,
          error: 'Cannot add more items. Insufficient stock available'
        });
      }

      cartItem = await existingCartItem.update({ 
        quantity: newQuantity,
        price: product.price // Update price in case it changed
      });
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        userId: req.user.id,
        productId,
        quantity,
        price: product.price
      });
    }

    // Include product details in response
    const cartItemWithProduct = await Cart.findByPk(cartItem.id, {
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'images', 'stockQuantity']
      }]
    });

    res.status(201).json({
      success: true,
      data: {
        cartItem: cartItemWithProduct
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error adding item to cart'
    });
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
router.put('/:id', authenticate, [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { quantity } = req.body;
    const { Cart, Product } = req.app.locals.models;

    const cartItem = await Cart.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [Product]
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }

    // Check stock availability
    if (cartItem.Product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock available'
      });
    }

    await cartItem.update({ 
      quantity,
      price: cartItem.Product.price // Update price in case it changed
    });

    res.json({
      success: true,
      data: {
        cartItem
      }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating cart item'
    });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { Cart } = req.app.locals.models;
    
    const cartItem = await Cart.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }

    await cartItem.destroy();

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error removing cart item'
    });
  }
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
router.delete('/', authenticate, async (req, res) => {
  try {
    const { Cart } = req.app.locals.models;
    
    await Cart.destroy({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error clearing cart'
    });
  }
});

module.exports = router;