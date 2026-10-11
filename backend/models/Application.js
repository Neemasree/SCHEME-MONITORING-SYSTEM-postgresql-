const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  beneficiary: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 150] },
  },
  scheme: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true },
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  status: {
    type: DataTypes.ENUM(
      'Submitted',
      'Pending Field Officer',
      'Pending District Officer',
      'Pending Admin',
      'Approved',
      'Rejected'
    ),
    allowNull: false,
    defaultValue: 'Pending Field Officer',
  },
  dateApplied: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  remarks: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
}, {
  indexes: [
    { fields: ['status'] },
    { fields: ['district', 'status'] },
    { fields: ['dateApplied'] },
  ],
});

module.exports = Application;
