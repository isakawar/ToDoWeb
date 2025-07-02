const API_URL = 'http://localhost:4000/api/tasks';
const LOGIN_URL = 'http://localhost:4000/api/login';
const HABITS_URL = 'http://localhost:4000/api/habits';
const NOTES_URL = 'http://localhost:4000/api/notes';
const FINANCE_URL = 'http://localhost:4000/api/finance';

function getSessionId() {
  return localStorage.getItem('sessionId');
}

export async function getTasks() {
  const res = await fetch(API_URL, {
    headers: { 'x-session-id': getSessionId() }
  });
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return { error: data.error || 'Unknown error', tasks: [] };
}

export async function addTask(task) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
    body: JSON.stringify(task),
  });
  return res.json();
}

export async function updateTask(id, updates) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'x-session-id': getSessionId() }
  });
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function getHabits() {
  const res = await fetch(HABITS_URL, {
    headers: { 'x-session-id': getSessionId() }
  });
  return res.json();
}

export async function addHabit(name, activeDays) {
  const res = await fetch(HABITS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
    body: JSON.stringify({ name, activeDays }),
  });
  return res.json();
}

export async function updateHabit(id, updates) {
  const res = await fetch(`${HABITS_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteHabit(id) {
  const res = await fetch(`${HABITS_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'x-session-id': getSessionId() }
  });
  return res.json();
}

export async function getNotes() {
  const res = await fetch(NOTES_URL, {
    headers: { 'x-session-id': getSessionId() }
  });
  return res.json();
}

export async function addNote(note) {
  const res = await fetch(NOTES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
    body: JSON.stringify(note),
  });
  return res.json();
}

export async function updateNote(id, updates) {
  const res = await fetch(`${NOTES_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteNote(id) {
  const res = await fetch(`${NOTES_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'x-session-id': getSessionId() }
  });
  return res.json();
}

export async function getFinance() {
  const res = await fetch(FINANCE_URL, {
    headers: { 'x-session-id': getSessionId() }
  });
  return res.json();
}

export async function updateFinancePlan(income, plannedExpenses) {
  const res = await fetch(FINANCE_URL + '/plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
    body: JSON.stringify({ income, plannedExpenses }),
  });
  return res.json();
}

export async function addExpense(expense) {
  const res = await fetch(FINANCE_URL + '/expense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
    body: JSON.stringify(expense),
  });
  return res.json();
}

export async function updateExpense(id, updates) {
  const res = await fetch(`${FINANCE_URL}/expense/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteExpense(id) {
  const res = await fetch(`${FINANCE_URL}/expense/${id}`, {
    method: 'DELETE',
    headers: { 'x-session-id': getSessionId() }
  });
  return res.json();
} 