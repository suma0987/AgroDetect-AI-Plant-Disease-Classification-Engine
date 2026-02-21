// models/Disease.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Disease = sequelize.define('Disease', {
  disease_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  disease_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  scientific_name: {
    type: DataTypes.STRING(200)
  },
  description: {
    type: DataTypes.TEXT
  },
  symptoms: {
    type: DataTypes.TEXT
  },
  causes: {
    type: DataTypes.TEXT
  },
  treatment: {
    type: DataTypes.TEXT
  },
  prevention: {
    type: DataTypes.TEXT
  },
  severity_level: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  }
}, {
  tableName: 'diseases',
  timestamps: false
});

module.exports = Disease;