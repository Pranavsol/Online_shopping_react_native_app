const express = require('express');
const { query, validationResult } = require('express-validator');
const { User, Order } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
router.get('/', authenticate, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('role').optional().isIn(['customer', 'admin']),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Search functionality
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(users.count / limit);

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: users.count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error fetching users'
    });
  }
});

// @desc    Get single user (Admin only)
// @route   GET /api/users/:id
// @access  Private (Admin)
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Order,
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user statistics
    const totalOrders = await Order.count({ where: { userId: user.id } });
    const totalSpent = await Order.sum('totalAmount', { 
      where: { userId: user.id, status: { [require('sequelize').Op.ne]: 'cancelled' } }
    });

    res.json({
      success: true,
      data: {
        user,
        statistics: {
          totalOrders,
          totalSpent: totalSpent || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error fetching user'
    });
  }
});

// @desc    Update user status (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private (Admin)
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user.id === req.user.id && !isActive) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account'
      });
    }

    await user.update({ isActive });

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error updating user status'
    });
  }
});

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
router.put('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be either customer or admin'
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot change your own role'
      });
    }

    await user.update({ role });

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error updating user role'
    });
  }
});

// @desc    Get dashboard statistics (Admin only)
// @route   GET /api/users/admin/dashboard
// @access  Private (Admin)
router.get('/admin/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { Product } = require('../models');

    // User statistics
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const newUsersThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    // Order statistics
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const completedOrders = await Order.count({ where: { status: 'delivered' } });
    const totalRevenue = await Order.sum('totalAmount', {
      where: { status: { [Op.ne]: 'cancelled' } }
    });

    // Product statistics
    const totalProducts = await Product.count({ where: { isActive: true } });
    const lowStockProducts = await Product.count({
      where: {
        isActive: true,
        stockQuantity: { [Op.lte]: require('sequelize').col('lowStockThreshold') }
      }
    });

    // Recent orders
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['firstName', 'lastName', 'email']
      }],
      attributes: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        statistics: {
          users: {
            total: totalUsers,
            active: activeUsers,
            newThisMonth: newUsersThisMonth
          },
          orders: {
            total: totalOrders,
            pending: pendingOrders,
            completed: completedOrders,
            revenue: totalRevenue || 0
          },
          products: {
            total: totalProducts,
            lowStock: lowStockProducts
          }
        },
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error fetching dashboard data'
    });
  }
});

module.exports = router;