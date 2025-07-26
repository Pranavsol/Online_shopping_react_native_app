const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Order, OrderItem, Cart, Product } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
router.post('/', authenticate, [
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
  body('shippingAddress.address').notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Zip code is required'),
  body('paymentMethod').isIn(['cash_on_delivery', 'credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

    // Get cart items
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        where: { isActive: true }
      }]
    });

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }

    // Validate stock availability
    for (const item of cartItems) {
      if (item.Product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${item.Product.name}. Only ${item.Product.stockQuantity} available.`
        });
      }
    }

    // Calculate totals
    const subtotal = cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);

    const taxAmount = subtotal * 0.1; // 10% tax
    const shippingAmount = subtotal > 500 ? 0 : 50; // Free shipping over ₹500
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: req.user.id,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      shippingAmount: parseFloat(shippingAmount.toFixed(2)),
      paymentMethod,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    // Create order items and update stock
    const orderItems = [];
    for (const cartItem of cartItems) {
      const orderItem = await OrderItem.create({
        orderId: order.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.price,
        totalPrice: parseFloat((cartItem.price * cartItem.quantity).toFixed(2)),
        productSnapshot: {
          name: cartItem.Product.name,
          description: cartItem.Product.description,
          images: cartItem.Product.images
        }
      });
      orderItems.push(orderItem);

      // Update product stock
      await cartItem.Product.update({
        stockQuantity: cartItem.Product.stockQuantity - cartItem.quantity
      });
    }

    // Clear cart
    await Cart.destroy({ where: { userId: req.user.id } });

    // Fetch complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderItem,
        include: [Product]
      }]
    });

    res.status(201).json({
      success: true,
      data: {
        order: completeOrder
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error creating order'
    });
  }
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };

    if (status) {
      where.status = status;
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'images']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(orders.count / limit);

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: orders.count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error fetching orders'
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const where = { id: req.params.id };
    
    // Regular users can only see their own orders
    if (req.user.role !== 'admin') {
      where.userId = req.user.id;
    }

    const order = await Order.findOne({
      where,
      include: [{
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'images', 'description']
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error fetching order'
    });
  }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', authenticate, [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
], async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findOne({
      where: { 
        id: req.params.id, 
        userId: req.user.id,
        status: { [Op.in]: ['pending', 'confirmed'] }
      },
      include: [{
        model: OrderItem,
        include: [Product]
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or cannot be cancelled'
      });
    }

    // Restore stock quantities
    for (const item of order.OrderItems) {
      if (item.Product) {
        await item.Product.update({
          stockQuantity: item.Product.stockQuantity + item.quantity
        });
      }
    }

    await order.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason
    });

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error cancelling order'
    });
  }
});

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
router.put('/:id/status', authenticate, authorize('admin'), [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid status'),
  body('trackingNumber').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { status, trackingNumber } = req.body;

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const updateData = { status };
    
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    await order.update(updateData);

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error updating order status'
    });
  }
});

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
router.get('/admin/all', authenticate, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
], async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'images']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(orders.count / limit);

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: orders.count
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error fetching orders'
    });
  }
});

module.exports = router;