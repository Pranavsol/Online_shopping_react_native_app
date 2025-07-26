# Backend API Documentation

## Online Shopping App Backend

A comprehensive REST API backend for an online shopping application built with Node.js, Express, and Sequelize ORM. Supports both MySQL and PostgreSQL databases.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Product Management**: Full CRUD operations with search, filtering, and pagination
- **Shopping Cart**: Add, update, remove items with stock validation
- **Order Management**: Complete order lifecycle with tracking
- **User Management**: Admin panel for user management
- **Database Support**: Both MySQL and PostgreSQL
- **Security**: Rate limiting, CORS, helmet, input validation
- **File Upload**: Support for product images
- **Soft Delete**: Paranoid models for data recovery

## Prerequisites

- Node.js (v14 or higher)
- MySQL or PostgreSQL database
- npm or yarn package manager

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Configure your database settings in `.env` file

5. Run database migrations and seed data
```bash
npm run migrate
```

6. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_TYPE=mysql # or postgres
DB_HOST=your-database-host
DB_PORT=3306 # or 5432 for postgres
DB_NAME=online_shopping
DB_USER=your-username
DB_PASSWORD=your-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# API Configuration
API_RATE_LIMIT=100
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Products
- `GET /api/products` - Get all products (with filtering/search)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `GET /api/products/categories/list` - Get product categories

### Shopping Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Orders
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/cancel` - Cancel order
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `GET /api/orders/admin/all` - Get all orders (Admin)

### User Management (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id/status` - Update user status
- `PUT /api/users/:id/role` - Update user role
- `GET /api/users/admin/dashboard` - Get dashboard statistics

## Default Admin Credentials

After running the migration script, you can login with:
- **Email**: admin@example.com
- **Password**: admin123

## Database Schema

### Users
- Personal information and authentication
- Role-based access (customer/admin)
- Address information

### Products
- Complete product information
- Inventory management
- SEO fields
- Image support

### Cart
- User shopping cart items
- Price tracking

### Orders & Order Items
- Complete order management
- Order tracking
- Payment information
- Shipping details

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Success Response Format

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

## Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.