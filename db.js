const { Sequelize, DataTypes } = require('sequelize');

// Підключення до SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

// Модель користувача
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
});

// Модель задачі
const Task = sequelize.define('Task', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company: DataTypes.STRING,
  priority: DataTypes.STRING,
  description: DataTypes.STRING,
  done: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  spentTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isTracking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: false,
});

// Зв'язок: User має багато Task
User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Task,
}; 