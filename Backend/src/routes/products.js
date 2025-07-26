const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('category').optional().trim(),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['name', 'price', 'createdAt', 'rating']),
  query('order').optional().isIn(['ASC', 'DESC']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 })
], optionalAuth, async (req, res) => {
  try {
    const { Product } = req.app.locals.models;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      search,
      sortBy = 'createdAt',
      order = 'DESC',
      minPrice,
      maxPrice,
      featured
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { isActive: true };

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Search functionality
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { shortDescription: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    // Featured filter
    if (featured === 'true') {
      where.isFeatured = true;
    }

    const products = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order.toUpperCase()]],
      attributes: {
        exclude: req.user?.role === 'admin' ? [] : ['seoTitle', 'seoDescription']
      }
    });

    const totalPages = Math.ceil(products.count / limit);

    res.json({
      success: true,
      data: {
        products: products.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: products.count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error fetching products'
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { Product } = req.app.locals.models;
    
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      },
      attributes: {
        exclude: req.user?.role === 'admin' ? [] : ['seoTitle', 'seoDescription']
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error fetching product'
    });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3-100 characters'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('category').optional().trim(),
  body('comparePrice').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ where: { sku: req.body.sku } });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Product with this SKU already exists'
      });
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error creating product'
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), [
  body('name').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('stockQuantity').optional().isInt({ min: 0 }),
  body('comparePrice').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check SKU uniqueness if it's being updated
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingProduct = await Product.findOne({ where: { sku: req.body.sku } });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          error: 'Product with this SKU already exists'
        });
      }
    }

    await product.update(req.body);

    res.json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error updating product'
    });
  }
});

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await product.destroy(); // Soft delete due to paranoid: true

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error deleting product'
    });
  }
});

// @desc    Get product categories
// @route   GET /api/products/categories/list
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const { Product } = req.app.locals.models;
    
    const categories = await Product.findAll({
      attributes: ['category'],
      where: { isActive: true },
      group: ['category'],
      raw: true
    });

    const categoryList = categories.map(item => item.category).filter(Boolean);

    res.json({
      success: true,
      data: {
        categories: categoryList
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error fetching categories'
    });
  }
});

module.exports = router;