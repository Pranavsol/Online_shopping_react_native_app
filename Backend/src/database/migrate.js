require('dotenv').config();
const { connectDatabase } = require('./connection');
const defineModels = require('../models/models');

const seedData = async () => {
  try {
    console.log('Starting database migration and seeding...');

    // Connect to database and define models first
    const sequelize = await connectDatabase();
    const { User, Product, Cart, Order, OrderItem } = defineModels(sequelize);

    // Now sync the models to create tables
    await sequelize.sync({ force: true });
    console.log('Database tables created successfully');

    // Create sample admin user
    const adminExists = await User.findOne({ where: { email: 'admin@example.com' } });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        phone: '9876543210',
        address: '123 Admin Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      });
      console.log('Admin user created');
    }

    // Create sample products
    const productsExist = await Product.count();
    if (productsExist === 0) {
      const sampleProducts = [
        {
          name: 'Premium Glass Cleaner',
          description: 'Professional grade glass cleaner with streak-free formula. Perfect for windows, mirrors, and glass surfaces.',
          shortDescription: 'Streak-free formula for windows and glass surfaces.',
          price: 299.99,
          comparePrice: 349.99,
          sku: 'GC001',
          stockQuantity: 50,
          category: 'cleaning-supplies',
          brand: 'CleanPro',
          tags: ['glass', 'cleaner', 'streak-free', 'professional'],
          images: [
            'https://images.unsplash.com/photo-1564925131-571f54cc7efd?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'
          ],
          isFeatured: true,
          rating: 4.5,
          reviewCount: 23
        },
        {
          name: 'Multi-Surface Disinfectant Spray',
          description: 'Kills 99.9% of germs and bacteria on all surfaces. Safe for use on kitchen counters, bathroom fixtures, and more.',
          shortDescription: 'Kills 99.9% of germs on all surfaces.',
          price: 199.99,
          comparePrice: 249.99,
          sku: 'MS002',
          stockQuantity: 75,
          category: 'cleaning-supplies',
          brand: 'GermShield',
          tags: ['disinfectant', 'multi-surface', 'antibacterial', 'spray'],
          images: [
            'https://images.unsplash.com/photo-1585503419537-87331fead7f3?w=400&h=400&fit=crop'
          ],
          isFeatured: true,
          rating: 4.7,
          reviewCount: 45
        },
        {
          name: 'Heavy Duty Floor Cleaner',
          description: 'Powerful floor cleaning solution for all types of flooring. Removes tough stains and leaves floors sparkling clean.',
          shortDescription: 'Powerful cleaning solution for all floor types.',
          price: 149.99,
          sku: 'FC003',
          stockQuantity: 30,
          category: 'cleaning-supplies',
          brand: 'FloorMaster',
          tags: ['floor', 'cleaner', 'heavy-duty', 'stain-removal'],
          images: [
            'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=400&fit=crop'
          ],
          rating: 4.3,
          reviewCount: 18
        },
        {
          name: 'Bathroom Tile Scrub',
          description: 'Specialized cleaner for bathroom tiles and grout. Removes soap scum, mildew, and hard water stains.',
          shortDescription: 'Specialized cleaner for bathroom tiles and grout.',
          price: 179.99,
          sku: 'BT004',
          stockQuantity: 25,
          category: 'cleaning-supplies',
          brand: 'TileShine',
          tags: ['bathroom', 'tile', 'grout', 'scrub'],
          images: [
            'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop'
          ],
          rating: 4.2,
          reviewCount: 12
        },
        {
          name: 'Kitchen Degreaser',
          description: 'Powerful degreasing formula specifically designed for kitchen use. Cuts through grease and grime easily.',
          shortDescription: 'Powerful degreasing formula for kitchen use.',
          price: 219.99,
          sku: 'KD005',
          stockQuantity: 40,
          category: 'cleaning-supplies',
          brand: 'KitchenPro',
          tags: ['kitchen', 'degreaser', 'grease', 'powerful'],
          images: [
            'https://images.unsplash.com/photo-1521334884684-d80222895322?w=400&h=400&fit=crop'
          ],
          rating: 4.6,
          reviewCount: 31
        }
      ];

      await Product.bulkCreate(sampleProducts);
      console.log('Sample products created');
    }

    console.log('Database migration and seeding completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = seedData;