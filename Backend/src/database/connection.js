const { Sequelize } = require('sequelize');

let sequelize;

const connectDatabase = async () => {
  try {
    const dbType = process.env.DB_TYPE || 'mysql';
    
    // Build connection URL for cloud database
    const connectionUrl = `${dbType}://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    const dbConfig = {
      dialect: dbType,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        connectTimeout: 60000
      }
    };

    sequelize = new Sequelize(connectionUrl, dbConfig);

    // Test the connection
    await sequelize.authenticate();
    console.log(`${dbType.toUpperCase()} database connection established successfully`);

    return sequelize;
  } catch (error) {
    console.error('Unable to connect to database:', error);
    throw error;
  }
};

const getSequelize = () => {
  if (!sequelize) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return sequelize;
};

const closeDatabase = async () => {
  if (sequelize) {
    await sequelize.close();
    console.log('Database connection closed');
  }
};

module.exports = {
  connectDatabase,
  getSequelize,
  closeDatabase,
  sequelize
};