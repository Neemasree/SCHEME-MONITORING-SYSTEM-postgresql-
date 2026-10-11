const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  entityType: { type: DataTypes.STRING(50), allowNull: false },
  entityId: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING(50), allowNull: false },
  actorId: { type: DataTypes.INTEGER, allowNull: false },
  actorRole: { type: DataTypes.STRING(50), allowNull: false },
  previousStatus: { type: DataTypes.STRING(50), allowNull: true },
  newStatus: { type: DataTypes.STRING(50), allowNull: true },
  remark: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
  indexes: [
    { fields: ['entityType', 'entityId', 'createdAt'] },
    { fields: ['actorId', 'createdAt'] },
  ],
});

module.exports = AuditLog;
