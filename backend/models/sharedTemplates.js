const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const sharedTemplates = sequelize.define('sharedTemplates', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dashboardKey: {
    type: DataTypes.INTEGER,
    unique: true
  },
  templateName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profileImageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  templatePath: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  likes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['templatePath']
    },
    {
      unique: true,
      fields: ['imagePath']
    },
    {
      unique: true,
      fields: ['dashboardKey']
    }
  ]
});

module.exports = sharedTemplates;
