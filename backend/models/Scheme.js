const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Scheme = sequelize.define('Scheme', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  schemeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  budget: {
    type: DataTypes.STRING,
  },
  district: {
    type: DataTypes.STRING,
  },
  startDate: {
    type: DataTypes.DATEONLY,
  },
  endDate: {
    type: DataTypes.DATEONLY,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
  beneficiariesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = Scheme;
