const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DistrictPerformance = sequelize.define('DistrictPerformance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  approved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pending: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  rejected: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  rating: {
    type: DataTypes.STRING,
  },
});

module.exports = DistrictPerformance;
