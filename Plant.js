// models/Plant.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Plant = sequelize.define('Plant', {
  plant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plant_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  scientific_name: {
    type: DataTypes.STRING(200)
  },
  description: {
    type: DataTypes.TEXT
  },
  growing_season: {
    type: DataTypes.STRING(50)
  },
  image_url: {
    type: DataTypes.STRING(500)
  }
}, {
  tableName: 'plants',
  timestamps: false
});

module.exports = Plant;