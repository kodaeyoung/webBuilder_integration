const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Dashboard = sequelize.define('Dashboard', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  projectName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deployPath: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  projectPath: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  modified: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    unique: false
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  shared: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  likes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  publish: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  websiteType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  features: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mood: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['projectPath']
    },
    {
      unique: true,
      fields: ['imagePath']
    },
    {
      unique: true,
      fields: ['deployPath']
    }
  ]
});

module.exports = Dashboard;
