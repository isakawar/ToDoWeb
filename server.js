const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 4000;

const { sequelize, User, Task, Finance, DailyExpense, Note, Habit } = require('./db');

app.use(cors());
app.use(bodyParser.json());

const TASKS_FILE = './data/tasks.json';
const USERS_FILE = './data/users.json';
const SESSIONS = {};
const HABITS_FILE = './data/habits.json';
const NOTES_FILE = './data/notes.json';
const FINANCE_FILE = './data/finance.json';

function readTasks() {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}
function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}
function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}
function readHabits() {
  return JSON.parse(fs.readFileSync(HABITS_FILE, 'utf8'));
}
function writeHabits(habits) {
  fs.writeFileSync(HABITS_FILE, JSON.stringify(habits, null, 2));
}
function readNotes() {
  return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
}
function writeNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}
function readFinance() {
  return JSON.parse(fs.readFileSync(FINANCE_FILE, 'utf8'));
}
function writeFinance(finance) {
  fs.writeFileSync(FINANCE_FILE, JSON.stringify(finance, null, 2));
}

// --- AUTH ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username, password } });
  if (!user) return res.status(401).json({ error: 'Невірний логін або пароль' });
  const sessionId = uuidv4();
  SESSIONS[sessionId] = user.id;
  res.json({ sessionId, username: user.username });
});

function requireSession(req, res, next) {
  const sessionId = req.headers['x-session-id'];
  const userId = SESSIONS[sessionId];
  if (!userId) return res.status(401).json({ error: 'Необхідна авторизація' });
  req.userId = userId;
  next();
}

// --- TASKS API ---
// Отримати всі задачі користувача
app.get('/api/tasks', requireSession, async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { userId: req.userId } });
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Додати нову задачу
app.post('/api/tasks', requireSession, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      id: Date.now(),
      userId: req.userId,
      spentTime: req.body.spentTime || 0,
      isTracking: req.body.isTracking || false,
    };
    console.log('Creating task:', taskData);
    const task = await Task.create(taskData);
    res.json(task);
  } catch (e) {
    console.error('Task create error:', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Оновити задачу
app.put('/api/tasks/:id', requireSession, async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!task) return res.status(404).json({ error: 'Задачу не знайдено' });
    Object.assign(task, req.body);
    await task.save();
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Видалити задачу
app.delete('/api/tasks/:id', requireSession, async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!task) return res.status(404).json({ error: 'Задачу не знайдено' });
    await task.destroy();
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// --- HABITS API ---
// Отримати всі звички користувача
app.get('/api/habits', requireSession, async (req, res) => {
  try {
    const habits = await Habit.findAll({ where: { userId: req.userId } });
    res.json(habits);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});
// Додати нову звичку
app.post('/api/habits', requireSession, async (req, res) => {
  try {
    const habitData = {
      id: Date.now(),
      userId: req.userId,
      name: req.body.name,
      days: Array.isArray(req.body.days) && req.body.days.length === 7 ? req.body.days : [false, false, false, false, false, false, false],
      activeDays: Array.isArray(req.body.activeDays) && req.body.activeDays.length === 7 ? req.body.activeDays : [true, true, true, true, true, true, true],
    };
    console.log('Creating habit:', habitData);
    const habit = await Habit.create(habitData);
    res.json(habit);
  } catch (e) {
    console.error('Habit create error:', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});
// Оновити звичку
app.put('/api/habits/:id', requireSession, async (req, res) => {
  try {
    const habit = await Habit.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!habit) return res.status(404).json({ error: 'Звичку не знайдено' });
    if (req.body.name !== undefined) habit.name = req.body.name;
    if (req.body.days !== undefined) habit.days = req.body.days;
    if (req.body.activeDays !== undefined) habit.activeDays = req.body.activeDays;
    await habit.save();
    res.json(habit);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});
// Видалити звичку
app.delete('/api/habits/:id', requireSession, async (req, res) => {
  try {
    const habit = await Habit.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!habit) return res.status(404).json({ error: 'Звичку не знайдено' });
    await habit.destroy();
    res.json(habit);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// --- NOTES API ---
// Отримати всі нотатки користувача
app.get('/api/notes', requireSession, async (req, res) => {
  try {
    const notes = await Note.findAll({ where: { userId: req.userId } });
    res.json(notes);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});
// Додати нову нотатку
app.post('/api/notes', requireSession, async (req, res) => {
  try {
    const noteData = {
      id: Date.now(),
      userId: req.userId,
      title: req.body.title || '',
      content: req.body.content || '',
      links: Array.isArray(req.body.links) ? req.body.links : [],
    };
    console.log('Creating note:', noteData);
    const note = await Note.create(noteData);
    res.json(note);
  } catch (e) {
    console.error('Note create error:', e);
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});
// Оновити нотатку
app.put('/api/notes/:id', requireSession, async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!note) return res.status(404).json({ error: 'Нотатку не знайдено' });
    if (req.body.title !== undefined) note.title = req.body.title;
    if (req.body.content !== undefined) note.content = req.body.content;
    if (req.body.links !== undefined) note.links = req.body.links;
    await note.save();
    res.json(note);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});
// Видалити нотатку
app.delete('/api/notes/:id', requireSession, async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!note) return res.status(404).json({ error: 'Нотатку не знайдено' });
    await note.destroy();
    res.json(note);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// --- FINANCE API ---

// Отримати фінансові дані користувача
app.get('/api/finance', requireSession, async (req, res) => {
  try {
    let finance = await Finance.findOne({
      where: { userId: req.userId },
      include: [{ model: DailyExpense }],
    });
    if (!finance) {
      // Якщо немає, повертаємо порожню структуру
      return res.json({
        userId: req.userId,
        income: { main: 0, extra: 0 },
        plannedExpenses: {},
        dailyExpenses: [],
      });
    }
    res.json({
      userId: req.userId,
      income: { main: finance.income_main, extra: finance.income_extra },
      plannedExpenses: finance.plannedExpenses || {},
      dailyExpenses: finance.DailyExpenses || [],
    });
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Оновити план доходів/витрат
app.put('/api/finance/plan', requireSession, async (req, res) => {
  try {
    let finance = await Finance.findOne({ where: { userId: req.userId } });
    if (!finance) {
      finance = await Finance.create({
        userId: req.userId,
        income_main: req.body.income?.main || 0,
        income_extra: req.body.income?.extra || 0,
        plannedExpenses: req.body.plannedExpenses || {},
      });
    } else {
      finance.income_main = req.body.income?.main ?? finance.income_main;
      finance.income_extra = req.body.income?.extra ?? finance.income_extra;
      finance.plannedExpenses = req.body.plannedExpenses ?? finance.plannedExpenses;
      await finance.save();
    }
    // Повертаємо актуальні дані з dailyExpenses
    const updated = await Finance.findOne({
      where: { userId: req.userId },
      include: [{ model: DailyExpense }],
    });
    res.json({
      userId: req.userId,
      income: { main: updated.income_main, extra: updated.income_extra },
      plannedExpenses: updated.plannedExpenses || {},
      dailyExpenses: updated.DailyExpenses || [],
    });
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Додати щоденну витрату
app.post('/api/finance/expense', requireSession, async (req, res) => {
  try {
    let finance = await Finance.findOne({ where: { userId: req.userId } });
    if (!finance) {
      // Якщо фінансового плану ще немає — створюємо
      finance = await Finance.create({ userId: req.userId });
    }
    const expense = await DailyExpense.create({
      financeId: finance.id,
      date: req.body.date,
      name: req.body.name,
      category: req.body.category,
      amount: req.body.amount,
    });
    res.json(expense);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Оновити витрату
app.put('/api/finance/expense/:id', requireSession, async (req, res) => {
  try {
    let finance = await Finance.findOne({ where: { userId: req.userId } });
    if (!finance) return res.status(404).json({ error: 'Фінансовий план не знайдено' });
    let expense = await DailyExpense.findOne({ where: { id: req.params.id, financeId: finance.id } });
    if (!expense) return res.status(404).json({ error: 'Витрату не знайдено' });
    expense.date = req.body.date ?? expense.date;
    expense.name = req.body.name ?? expense.name;
    expense.category = req.body.category ?? expense.category;
    expense.amount = req.body.amount ?? expense.amount;
    await expense.save();
    res.json(expense);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Видалити витрату
app.delete('/api/finance/expense/:id', requireSession, async (req, res) => {
  try {
    let finance = await Finance.findOne({ where: { userId: req.userId } });
    if (!finance) return res.status(404).json({ error: 'Фінансовий план не знайдено' });
    let expense = await DailyExpense.findOne({ where: { id: req.params.id, financeId: finance.id } });
    if (!expense) return res.status(404).json({ error: 'Витрату не знайдено' });
    await expense.destroy();
    res.json(expense);
  } catch (e) {
    res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// --- МІГРАЦІЯ ДАНИХ З JSON У MYSQL ---
app.post('/api/migrate', async (req, res) => {
  try {
    // Users
    const users = readUsers();
    for (const u of users) {
      let [user, created] = await User.findOrCreate({
        where: { username: u.username },
        defaults: { password: u.password },
      });
      // Tasks
      const tasks = readTasks().filter(t => t.userId === u.id);
      for (const t of tasks) {
        await Task.findOrCreate({
          where: { id: t.id },
          defaults: {
            title: t.title,
            company: t.company,
            priority: t.priority,
            description: t.description,
            done: t.done,
            spentTime: t.spentTime,
            isTracking: t.isTracking,
            userId: user.id,
          },
        });
      }
      // Notes
      const notes = readNotes().filter(n => n.userId === u.id);
      for (const n of notes) {
        await Note.findOrCreate({
          where: { id: n.id },
          defaults: {
            title: n.title,
            content: n.content,
            links: n.links,
            userId: user.id,
          },
        });
      }
      // Habits
      const habits = readHabits().filter(h => h.userId === u.id);
      for (const h of habits) {
        await Habit.findOrCreate({
          where: { id: h.id },
          defaults: {
            name: h.name,
            days: h.days,
            activeDays: h.activeDays,
            userId: user.id,
          },
        });
      }
    }
    res.json({ status: 'ok' });
  } catch (e) {
    console.error('Migration error:', e);
    res.status(500).json({ error: 'Migration error', details: e.message });
  }
});

// Синхронізація моделей і старт сервера
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}); 