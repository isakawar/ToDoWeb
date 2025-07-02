const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

const TASKS_FILE = './data/tasks.json';
const USERS_FILE = './data/users.json';
const SESSIONS = {};
const HABITS_FILE = './data/habits.json';
const NOTES_FILE = './data/notes.json';

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

// --- AUTH ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);
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
app.get('/api/tasks', requireSession, (req, res) => {
  const tasks = readTasks();
  res.json(tasks.filter(t => t.userId === req.userId));
});

app.post('/api/tasks', requireSession, (req, res) => {
  const tasks = readTasks();
  const newTask = { ...req.body, id: Date.now(), userId: req.userId };
  tasks.push(newTask);
  writeTasks(tasks);
  res.json(newTask);
});

app.put('/api/tasks/:id', requireSession, (req, res) => {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id == req.params.id && t.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Задачу не знайдено' });
  tasks[idx] = { ...tasks[idx], ...req.body };
  writeTasks(tasks);
  res.json(tasks[idx]);
});

app.delete('/api/tasks/:id', requireSession, (req, res) => {
  let tasks = readTasks();
  const idx = tasks.findIndex(t => t.id == req.params.id && t.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Задачу не знайдено' });
  const deleted = tasks[idx];
  tasks.splice(idx, 1);
  writeTasks(tasks);
  res.json(deleted);
});

// --- HABITS API ---
// Отримати всі звички користувача
app.get('/api/habits', requireSession, (req, res) => {
  const habits = readHabits();
  res.json(habits.filter(h => h.userId === req.userId));
});
// Додати нову звичку
app.post('/api/habits', requireSession, (req, res) => {
  const habits = readHabits();
  const newHabit = {
    id: Date.now(),
    userId: req.userId,
    name: req.body.name,
    days: Array.isArray(req.body.days) && req.body.days.length === 7 ? req.body.days : [false, false, false, false, false, false, false],
    activeDays: Array.isArray(req.body.activeDays) && req.body.activeDays.length === 7 ? req.body.activeDays : [true, true, true, true, true, true, true],
  };
  habits.push(newHabit);
  writeHabits(habits);
  res.json(newHabit);
});
// Оновити звичку (наприклад, відмітки по днях або дні очікування)
app.put('/api/habits/:id', requireSession, (req, res) => {
  const habits = readHabits();
  const idx = habits.findIndex(h => h.id == req.params.id && h.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Звичку не знайдено' });
  habits[idx] = { ...habits[idx], ...req.body };
  writeHabits(habits);
  res.json(habits[idx]);
});
// Видалити звичку
app.delete('/api/habits/:id', requireSession, (req, res) => {
  let habits = readHabits();
  const idx = habits.findIndex(h => h.id == req.params.id && h.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Звичку не знайдено' });
  const deleted = habits[idx];
  habits.splice(idx, 1);
  writeHabits(habits);
  res.json(deleted);
});

// --- NOTES API ---
// Отримати всі нотатки користувача
app.get('/api/notes', requireSession, (req, res) => {
  const notes = readNotes();
  res.json(notes.filter(n => n.userId === req.userId));
});
// Додати нову нотатку
app.post('/api/notes', requireSession, (req, res) => {
  const notes = readNotes();
  const newNote = {
    id: Date.now(),
    userId: req.userId,
    title: req.body.title || '',
    content: req.body.content || '',
    links: Array.isArray(req.body.links) ? req.body.links : [],
  };
  notes.push(newNote);
  writeNotes(notes);
  res.json(newNote);
});
// Оновити нотатку
app.put('/api/notes/:id', requireSession, (req, res) => {
  const notes = readNotes();
  const idx = notes.findIndex(n => n.id == req.params.id && n.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Нотатку не знайдено' });
  notes[idx] = { ...notes[idx], ...req.body };
  writeNotes(notes);
  res.json(notes[idx]);
});
// Видалити нотатку
app.delete('/api/notes/:id', requireSession, (req, res) => {
  let notes = readNotes();
  const idx = notes.findIndex(n => n.id == req.params.id && n.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Нотатку не знайдено' });
  const deleted = notes[idx];
  notes.splice(idx, 1);
  writeNotes(notes);
  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
}); 