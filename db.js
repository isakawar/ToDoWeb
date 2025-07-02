const { Sequelize, DataTypes } = require('sequelize');

// Підключення до MySQL через змінні оточення
const sequelize = new Sequelize(
  process.env.DB_NAME || 'todoqa_db',
  process.env.DB_USER || 'todoqa',
  process.env.DB_PASSWORD || 'todoqa_pass',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

// Модель користувача
const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
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
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
  },
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

// Фінансовий план користувача
const Finance = sequelize.define('Finance', {
  income_main: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  income_extra: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  plannedExpenses: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  timestamps: false,
});

// Щоденні витрати
const DailyExpense = sequelize.define('DailyExpense', {
  date: DataTypes.DATEONLY,
  name: DataTypes.STRING,
  category: DataTypes.STRING,
  amount: DataTypes.INTEGER,
}, {
  timestamps: false,
});

// Модель звички
const Habit = sequelize.define('Habit', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  days: {
    type: DataTypes.JSON,
    defaultValue: [false, false, false, false, false, false, false],
  },
  activeDays: {
    type: DataTypes.JSON,
    defaultValue: [true, true, true, true, true, true, true],
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  timestamps: false,
});

// Модель нотатки
const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  content: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  links: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  timestamps: false,
});

// Зв'язки
User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Finance, { foreignKey: 'userId' });
Finance.belongsTo(User, { foreignKey: 'userId' });

Finance.hasMany(DailyExpense, { foreignKey: 'financeId' });
DailyExpense.belongsTo(Finance, { foreignKey: 'financeId' });

User.hasMany(Habit, { foreignKey: 'userId' });
Habit.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Note, { foreignKey: 'userId' });
Note.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Task,
  Finance,
  DailyExpense,
  Habit,
  Note,
}; 