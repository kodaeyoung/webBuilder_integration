const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const basicTemplates = sequelize.define('basicTemplates', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  templateName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  templatePath: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  websiteType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  feature: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mood: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['templatePath']
    }
  ]
});

module.exports = basicTemplates;
