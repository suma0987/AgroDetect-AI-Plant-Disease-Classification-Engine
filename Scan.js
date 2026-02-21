// models/Scan.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserScan = sequelize.define('UserScan', {
  scan_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  plant_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'plants',
      key: 'plant_id'
    }
  },
  disease_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'diseases',
      key: 'disease_id'
    }
  },
  image_url: {
    type: DataTypes.STRING(500)
  },
  confidence_score: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  severity_detected: {
    type: DataTypes.STRING(50)
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'user_scans',
  timestamps: true,
  createdAt: 'scan_date',
  updatedAt: false
});

// Define associations
UserScan.associate = (models) => {
  UserScan.belongsTo(models.User, { foreignKey: 'user_id' });
  UserScan.belongsTo(models.Plant, { foreignKey: 'plant_id' });
  UserScan.belongsTo(models.Disease, { foreignKey: 'disease_id' });
};

module.exports = UserScan;