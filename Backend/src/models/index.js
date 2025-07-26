const { getSequelize } = require('../database/connection');
const defineModels = require('./models');

let models = null;

const getModels = () => {
  if (!models) {
    const sequelize = getSequelize();
    models = defineModels(sequelize);
  }
  return models;
};

module.exports = getModels;