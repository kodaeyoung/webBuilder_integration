const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ImageStore = sequelize.define('imageStore', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {

  timestamps: false, // createdAt, updatedAt 필드를 사용하지 않으려면 false로 설정    
  indexes: [
    {
      unique: true,
      fields: ['imagePath']
    },
  ]
});

module.exports = ImageStore;
