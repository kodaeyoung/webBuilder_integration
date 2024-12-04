const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Deploy = sequelize.define('Deploy', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  //오리지널 경로
  templatePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  //deployProjects의 경로
  deployProjectPath: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  deployName: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['templatePath']
    },
    {
      unique: true,
      fields: ['deployProjectPath']
    },
    {
        unique: true,
        fields: ['deployName']
    }
  ]
});

module.exports = Deploy;
