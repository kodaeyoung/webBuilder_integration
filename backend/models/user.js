const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  profileImageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['googleId']
    },
    {
      unique: true,
      fields: ['email']
    }
  ]
});

module.exports = User;
