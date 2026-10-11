const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 100] },
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('email', typeof value === 'string' ? value.trim().toLowerCase() : value);
    },
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [8, 128] },
  },
  role: {
    type: DataTypes.ENUM('admin', 'district_officer', 'field_officer', 'beneficiary'),
    allowNull: false,
    defaultValue: 'beneficiary',
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        user.password = await bcrypt.hash(user.password, await bcrypt.genSalt(12));
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, await bcrypt.genSalt(10));
      }
    },
  },
});

User.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
