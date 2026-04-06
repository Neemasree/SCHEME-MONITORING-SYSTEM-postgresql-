const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  beneficiary: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scheme: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateApplied: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  remarks: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
});

module.exports = Application;
