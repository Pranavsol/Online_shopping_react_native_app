const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDatabase } = require('./database/connection');
const defineModels = require('./models/models');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'exp://localhost:19000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.API_RATE_LIMIT || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to database and define models
    console.log('Connecting to database...');
    const sequelize = await connectDatabase();
    const models = defineModels(sequelize);
    
    // Make models available to routes
    app.locals.models = models;
    console.log('Database connected and models defined successfully');

    // Import routes after models are defined
    const authRoutes = require('./routes/auth');
    const productRoutes = require('./routes/products');
    const cartRoutes = require('./routes/cart');
    const orderRoutes = require('./routes/orders');
    const userRoutes = require('./routes/users');

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/users', userRoutes);

    // API Health check endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        message: 'API Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        endpoints: {
          auth: '/api/auth',
          products: '/api/products',
          cart: '/api/cart',
          orders: '/api/orders',
          users: '/api/users'
        }
      });
    });

    // Static file serving for uploads
    app.use('/uploads', express.static('uploads'));

    // Error handling middleware
    app.use(notFound);
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = app;