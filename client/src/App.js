import React, { useEffect, useState } from 'react';
import { getTasks, addTask, updateTask, deleteTask, login, getHabits, addHabit, updateHabit, deleteHabit, getNotes, addNote, updateNote, deleteNote, getFinance, updateFinancePlan, addExpense, updateExpense, deleteExpense } from './api';
import './App.css';
import pomodoroSound from './pomodoro.mp3';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

const COMPANIES = [
  { value: 'RG', label: 'RG', color: '#43a047' }, // Зелений
  { value: 'EXIST', label: 'EXIST', color: '#ffd600' }, // Жовтий
  { value: 'learning', label: 'Навчання', color: '#00bcd4' },
];
const PRIORITIES = [
  { value: 'high', label: 'Високий' },
  { value: 'medium', label: 'Середній' },
  { value: 'low', label: 'Низький' },
];
const DONE_FILTERS = [
  { value: 'all', label: 'Всі' },
  { value: 'active', label: 'Активні' },
  { value: 'done', label: 'Виконані' },
];

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const EXPENSE_CATEGORIES = [
  'Податки',
  'Кредити',
  'Квартира',
  'Комунальні послуги',
  'Харчування',
  "Сотовий зв'язок, підписки",
  'Англійська',
  'Тренажерний зал',
  'Авто',
  'Розваги',
  'Догляд за собою',
  'Подарунки',
  'Інвестиції',
  'Одяг',
  'Інше',
  'Розвиток (книги/курси)'
];

function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [newActiveDays, setNewActiveDays] = useState([true, true, true, true, true, true, true]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHabits().then(data => {
      setHabits(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  // Підрахунок прогресу
  const getProgress = () => {
    let total = 0, done = 0;
    habits.forEach(habit => {
      if (!habit.activeDays) habit.activeDays = [true, true, true, true, true, true, true];
      for (let i = 0; i < 7; ++i) {
        if (habit.activeDays[i]) {
          total++;
          if (habit.days[i]) done++;
        }
      }
    });
    return total === 0 ? 0 : Math.round((done / total) * 100);
  };

  const handleAdd = async e => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    const habit = await addHabit(newHabit.trim(), newActiveDays);
    setHabits(habits => [...habits, habit]);
    setNewHabit('');
    setNewActiveDays([true, true, true, true, true, true, true]);
  };

  const handleToggle = async (habitId, dayIdx) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.activeDays[dayIdx]) return;
    const days = [...habit.days];
    days[dayIdx] = !days[dayIdx];
    const updated = await updateHabit(habitId, { days });
    setHabits(habits => habits.map(h => h.id === habitId ? updated : h));
  };

  const handleDelete = async habitId => {
    await deleteHabit(habitId);
    setHabits(habits => habits.filter(h => h.id !== habitId));
  };

  const handleActiveDayChange = idx => {
    setNewActiveDays(days => days.map((v, i) => i === idx ? !v : v));
  };

  return (
    <div className="habit-tracker">
      <h2>Трекер звичок</h2>
      <div className="habit-progress">
        <div className="habit-progress-bar" style={{width: getProgress() + '%'}}></div>
        <span>{getProgress()}% виконано</span>
      </div>
      <form className="habit-form" onSubmit={handleAdd}>
        <input
          value={newHabit}
          onChange={e => setNewHabit(e.target.value)}
          placeholder="Нова звичка"
          className="habit-input"
        />
        <div className="habit-days-select">
          {WEEKDAYS.map((d, i) => (
            <label key={d} className={newActiveDays[i] ? '' : 'inactive'}>
              <input type="checkbox" checked={newActiveDays[i]} onChange={() => handleActiveDayChange(i)} />{d}
            </label>
          ))}
        </div>
        <button type="submit" className="habit-add-btn">Додати</button>
      </form>
      {loading ? <div>Завантаження...</div> : (
        <table className="habit-table">
          <thead>
            <tr>
              <th>Звичка</th>
              {WEEKDAYS.map(day => <th key={day}>{day}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {habits.map(habit => (
              <tr key={habit.id}>
                <td>{habit.name}</td>
                {WEEKDAYS.map((_, idx) => (
                  <td key={idx}>
                    <input
                      type="checkbox"
                      checked={!!habit.days[idx]}
                      disabled={!habit.activeDays?.[idx]}
                      onChange={() => handleToggle(habit.id, idx)}
                    />
                  </td>
                ))}
                <td>
                  <button className="habit-del-btn" onClick={() => handleDelete(habit.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function NotesBoard() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', links: [''] });

  useEffect(() => {
    getNotes().then(data => {
      setNotes(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const openModal = (note = null) => {
    setEditNote(note);
    setForm(note ? {
      title: note.title,
      content: note.content,
      links: note.links && note.links.length ? note.links : ['']
    } : { title: '', content: '', links: [''] });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditNote(null);
    setForm({ title: '', content: '', links: [''] });
  };

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLinkChange = (idx, value) => {
    setForm(f => {
      const links = [...f.links];
      links[idx] = value;
      return { ...f, links };
    });
  };

  const addLinkField = () => {
    setForm(f => ({ ...f, links: [...f.links, ''] }));
  };

  const removeLinkField = idx => {
    setForm(f => {
      const links = f.links.filter((_, i) => i !== idx);
      return { ...f, links: links.length ? links : [''] };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const links = form.links.map(l => l.trim()).filter(Boolean);
    if (editNote) {
      const updated = await updateNote(editNote.id, { ...form, links });
      setNotes(notes => notes.map(n => n.id === editNote.id ? updated : n));
    } else {
      const created = await addNote({ ...form, links });
      setNotes(notes => [...notes, created]);
    }
    closeModal();
  };

  const handleDelete = async id => {
    await deleteNote(id);
    setNotes(notes => notes.filter(n => n.id !== id));
  };

  return (
    <div className="notes-board">
      <h2>Нотатки</h2>
      <button className="note-add-btn" onClick={() => openModal()}>+ Додати нотатку</button>
      {loading ? <div>Завантаження...</div> : (
        <div className="notes-grid">
          {notes.map(note => (
            <div className="note-sticker" key={note.id}>
              <div className="note-title-row">
                <div className="note-title">{note.title || 'Без назви'}</div>
                <button className="note-edit-btn" onClick={() => openModal(note)}>✏️</button>
                <button className="note-del-btn" onClick={() => handleDelete(note.id)}>🗑️</button>
              </div>
              <div className="note-content">{note.content}</div>
              {note.links && note.links.length > 0 && (
                <div className="note-links">
                  {note.links.map((l, i) => l && <a key={i} href={l} target="_blank" rel="noopener noreferrer">🔗 {l}</a>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editNote ? 'Редагувати нотатку' : 'Нова нотатка'}</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <input
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Заголовок"
              />
              <textarea
                name="content"
                value={form.content}
                onChange={handleFormChange}
                placeholder="Текст нотатки"
                rows={4}
                style={{resize: 'vertical'}}
              />
              <div className="note-links-form">
                <b>Посилання:</b>
                {form.links.map((l, idx) => (
                  <div key={idx} className="note-link-row">
                    <input
                      value={l}
                      onChange={e => handleLinkChange(idx, e.target.value)}
                      placeholder="https://..."
                    />
                    <button type="button" onClick={() => removeLinkField(idx)} disabled={form.links.length === 1}>-</button>
                  </div>
                ))}
                <button type="button" onClick={addLinkField}>+ Додати посилання</button>
              </div>
              <div className="modal-actions">
                <button type="submit">{editNote ? 'Зберегти' : 'Додати'}</button>
                <button type="button" onClick={closeModal}>Скасувати</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function FinancePlanner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planIncome, setPlanIncome] = useState({ main: '', extra: '' });
  const [planExpenses, setPlanExpenses] = useState({});
  const [expenseForm, setExpenseForm] = useState({ date: getToday(), name: '', category: EXPENSE_CATEGORIES[0], amount: '' });
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    getFinance().then(fin => {
      setData(fin);
      setPlanIncome(fin.income || { main: '', extra: '' });
      setPlanExpenses(fin.plannedExpenses || {});
      setLoading(false);
    });
  }, []);

  const handlePlanChange = e => {
    setPlanIncome({ ...planIncome, [e.target.name]: e.target.value });
  };
  const handlePlanExpenseChange = (cat, value) => {
    setPlanExpenses(pe => ({ ...pe, [cat]: value }));
  };
  const savePlan = async () => {
    const res = await updateFinancePlan(
      { main: Number(planIncome.main) || 0, extra: Number(planIncome.extra) || 0 },
      Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c, Number(planExpenses[c]) || 0]))
    );
    setData(res);
  };

  const handleExpenseForm = e => {
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  };
  const handleExpenseSubmit = async e => {
    e.preventDefault();
    if (!expenseForm.date || !expenseForm.name || !expenseForm.amount) return;
    if (editExpenseId) {
      const updated = await updateExpense(editExpenseId, { ...expenseForm, amount: Number(expenseForm.amount) });
      setData(d => ({ ...d, dailyExpenses: d.dailyExpenses.map(e => e.id === editExpenseId ? updated : e) }));
      setEditExpenseId(null);
    } else {
      const created = await addExpense({ ...expenseForm, amount: Number(expenseForm.amount) });
      setData(d => ({ ...d, dailyExpenses: [...d.dailyExpenses, created] }));
    }
    setExpenseForm({ date: getToday(), name: '', category: EXPENSE_CATEGORIES[0], amount: '' });
  };
  const handleExpenseEdit = exp => {
    setEditExpenseId(exp.id);
    setExpenseForm({ date: exp.date, name: exp.name, category: exp.category, amount: exp.amount });
  };
  const handleExpenseDelete = async id => {
    await deleteExpense(id);
    setData(d => ({ ...d, dailyExpenses: d.dailyExpenses.filter(e => e.id !== id) }));
  };

  // Підрахунок
  const totalPlanIncome = Number(planIncome.main) + Number(planIncome.extra);
  const totalPlanExpenses = EXPENSE_CATEGORIES.reduce((sum, c) => sum + (Number(planExpenses[c]) || 0), 0);
  const factExpensesByCat = {};
  (data?.dailyExpenses || []).forEach(e => {
    factExpensesByCat[e.category] = (factExpensesByCat[e.category] || 0) + Number(e.amount);
  });
  const totalFactExpenses = Object.values(factExpensesByCat).reduce((a, b) => a + b, 0);
  const balance = totalPlanIncome - totalFactExpenses;

  // Pie chart data
  const pieData = {
    labels: EXPENSE_CATEGORIES,
    datasets: [
      {
        data: EXPENSE_CATEGORIES.map(c => factExpensesByCat[c] || 0),
        backgroundColor: [
          '#ffb300', '#64b5f6', '#81c784', '#e57373', '#ba68c8', '#ffd54f', '#b0bec5'
        ],
      },
    ],
  };

  return (
    <div className="finance-planner">
      <h2>Фінансовий планер</h2>
      <button className="finance-plan-btn" onClick={() => setShowPlanModal(true)}>Редагувати фінансовий план</button>
      {showPlanModal && (
        <div className="modal-backdrop" onClick={() => setShowPlanModal(false)}>
          <div className="modal finance-plan-modal" onClick={e => e.stopPropagation()}>
            <h3>План доходів</h3>
            <div className="plan-income-row">
              <span>Основний дохід:</span>
              <input name="main" type="number" value={planIncome.main} onChange={handlePlanChange} placeholder="0" />
            </div>
            <div className="plan-income-row">
              <span>Додатковий дохід:</span>
              <input name="extra" type="number" value={planIncome.extra} onChange={handlePlanChange} placeholder="0" />
            </div>
            <h3>План витрат по категоріях</h3>
            {EXPENSE_CATEGORIES.map(cat => (
              <div key={cat} className="plan-expense-row">
                <span>{cat}:</span>
                <input type="number" value={planExpenses[cat] || ''} onChange={e => handlePlanExpenseChange(cat, e.target.value)} />
              </div>
            ))}
            <div className="modal-actions">
              <button className="finance-save-btn" onClick={() => { savePlan(); setShowPlanModal(false); }}>Зберегти</button>
              <button type="button" onClick={() => setShowPlanModal(false)}>Скасувати</button>
            </div>
          </div>
        </div>
      )}
      {loading ? <div>Завантаження...</div> : (
        <>
          <div className="finance-summary">
            <div>Очікуваний дохід: <b>{totalPlanIncome} грн</b></div>
            <div>Очікувані витрати: <b>{totalPlanExpenses} грн</b></div>
            <div>Фактичні витрати: <b>{totalFactExpenses} грн</b></div>
            <div>Поточний баланс: <b style={{color: balance >= 0 ? '#43a047' : '#d32f2f'}}>{balance} грн</b></div>
          </div>
          <div className="finance-diff-table">
            <table>
              <thead>
                <tr>
                  <th>Категорія</th>
                  <th>План</th>
                  <th>Факт</th>
                  <th>Різниця</th>
                </tr>
              </thead>
              <tbody>
                {EXPENSE_CATEGORIES.map(cat => {
                  const plan = Number(planExpenses[cat]) || 0;
                  const fact = factExpensesByCat[cat] || 0;
                  const diff = plan - fact;
                  return (
                    <tr key={cat}>
                      <td>{cat}</td>
                      <td>{plan}</td>
                      <td>{fact}</td>
                      <td style={{color: diff >= 0 ? '#43a047' : '#d32f2f'}}>{diff}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="finance-expenses-block">
            <h3>Щоденні витрати</h3>
            <form className="expense-form" onSubmit={handleExpenseSubmit}>
              <input name="date" type="date" value={expenseForm.date} onChange={handleExpenseForm} required />
              <input name="name" value={expenseForm.name} onChange={handleExpenseForm} placeholder="Назва" required />
              <select name="category" value={expenseForm.category} onChange={handleExpenseForm}>
                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input name="amount" type="number" value={expenseForm.amount} onChange={handleExpenseForm} placeholder="Сума" required />
              <button type="submit">{editExpenseId ? 'Зберегти' : 'Додати'}</button>
              {editExpenseId && <button type="button" onClick={() => { setEditExpenseId(null); setExpenseForm({ date: getToday(), name: '', category: EXPENSE_CATEGORIES[0], amount: '' }); }}>Скасувати</button>}
            </form>
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Назва</th>
                  <th>Категорія</th>
                  <th>Сума</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data?.dailyExpenses || []).map(exp => (
                  <tr key={exp.id}>
                    <td>{exp.date}</td>
                    <td>{exp.name}</td>
                    <td>{exp.category}</td>
                    <td>{exp.amount}</td>
                    <td>
                      <button className="expense-edit-btn" onClick={() => handleExpenseEdit(exp)}>✏️</button>
                      <button className="expense-del-btn" onClick={() => handleExpenseDelete(exp.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="finance-charts">
            <h3>Діаграма витрат по категоріях</h3>
            <Pie data={pieData} />
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [doneFilter, setDoneFilter] = useState('all');
  const [form, setForm] = useState({
    title: '',
    company: 'RG',
    priority: 'medium',
    plannedTime: '',
    description: '',
    done: false,
  });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pomodoroMode, setPomodoroMode] = useState('work');
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroInterval, setPomodoroInterval] = useState(null);
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [auth, setAuth] = useState({ sessionId: localStorage.getItem('sessionId'), username: localStorage.getItem('username') });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState('tasks');

  useEffect(() => {
    if (auth.sessionId) {
      getTasks().then(res => {
        if (Array.isArray(res)) {
          setTasks(res);
        } else if (res && res.error) {
          // sessionId невалідний або закінчився
          localStorage.removeItem('sessionId');
          localStorage.removeItem('username');
          setAuth({ sessionId: null, username: null });
          setTasks([]);
        }
      });
    }
  }, [auth.sessionId]);

  useEffect(() => {
    let interval = null;
    if (pomodoroRunning) {
      interval = setInterval(() => {
        setPomodoroTime(t => t - 1);
      }, 1000);
      setPomodoroInterval(interval);
    } else if (pomodoroInterval) {
      clearInterval(pomodoroInterval);
      setPomodoroInterval(null);
    }
    return () => interval && clearInterval(interval);
  }, [pomodoroRunning]);

  useEffect(() => {
    if (!pomodoroRunning) {
      if (pomodoroMode === 'work') setPomodoroTime(workMinutes * 60);
      else setPomodoroTime(breakMinutes * 60);
    }
    // eslint-disable-next-line
  }, [workMinutes, breakMinutes, pomodoroMode]);

  useEffect(() => {
    if (pomodoroTime === 0) {
      setPomodoroRunning(false);
      const audio = new Audio(pomodoroSound);
      audio.play();
      setTimeout(() => {
        if (pomodoroMode === 'work') {
          setPomodoroMode('break');
          setPomodoroTime(breakMinutes * 60);
        } else {
          setPomodoroMode('work');
          setPomodoroTime(workMinutes * 60);
        }
        setPomodoroRunning(false);
      }, 500);
    }
  }, [pomodoroTime, pomodoroMode, workMinutes, breakMinutes]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async e => {
    e.preventDefault();
    if (!form.title) return;
    if (editId) {
      await updateTask(editId, form);
      setTasks(tasks => tasks.map(t => t.id === editId ? { ...t, ...form } : t));
      setEditId(null);
    } else {
      const newTask = {
        ...form,
        spentTime: 0,
        isTracking: false,
      };
      const saved = await addTask(newTask);
      setTasks([...tasks, saved]);
    }
    setForm({ title: '', company: 'RG', priority: 'medium', plannedTime: '', description: '', done: false });
    setShowModal(false);
  };

  const handleDelete = async id => {
    await deleteTask(id);
    setTasks(tasks => tasks.filter(t => t.id !== id));
  };

  const handleEdit = task => {
    setForm({ ...task });
    setEditId(task.id);
    setShowModal(true);
  };

  const handleDone = async (id, checked) => {
    await updateTask(id, { done: checked });
    setTasks(tasks => tasks.map(t => t.id === id ? { ...t, done: checked } : t));
  };

  const handleClearAll = async () => {
    await Promise.all(tasks.map(t => deleteTask(t.id)));
    setTasks([]);
    setShowClearAllModal(false);
  };

  const filteredTasks = tasks.filter(t =>
    (filter === 'all' || t.company === filter) &&
    (priorityFilter === 'all' || t.priority === priorityFilter) &&
    (doneFilter === 'all' || (doneFilter === 'done' ? t.done : !t.done))
  );

  const getCompanyBadge = company => {
    const c = COMPANIES.find(x => x.value === company);
    if (!c) return null;
    return <span className="company-badge" style={{ background: c.color }}>{c.label}</span>;
  };

  const startPomodoro = () => setPomodoroRunning(true);
  const stopPomodoro = () => setPomodoroRunning(false);
  const resetPomodoro = () => {
    setPomodoroRunning(false);
    setPomodoroMode('work');
    setPomodoroTime(workMinutes * 60);
  };
  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handleLogin = async e => {
    e.preventDefault();
    setLoginError('');
    const res = await login(loginForm.username, loginForm.password);
    if (res.sessionId) {
      localStorage.setItem('sessionId', res.sessionId);
      localStorage.setItem('username', res.username);
      setAuth({ sessionId: res.sessionId, username: res.username });
    } else {
      setLoginError(res.error || 'Помилка авторизації');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    setAuth({ sessionId: null, username: null });
    setTasks([]);
  };

  if (!auth.sessionId) {
    return (
      <div className="main-layout" style={{justifyContent: 'center', alignItems: 'center'}}>
        <form className="modal-form" style={{minWidth: 320, margin: 'auto'}} onSubmit={handleLogin}>
          <h2>Вхід</h2>
          <input
            name="username"
            placeholder="Логін"
            value={loginForm.username}
            onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Пароль"
            value={loginForm.password}
            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
            required
          />
          {loginError && <div style={{color: 'red'}}>{loginError}</div>}
          <div className="modal-actions">
            <button type="submit">Увійти</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <header className="main-header">
        <div className="header-content">
          <span>Вітаю, {auth.username}!</span>
          <div className="header-nav">
            <button className={page === 'tasks' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('tasks')}>Планувальник</button>
            <button className={page === 'habits' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('habits')}>Трекер звичок</button>
            <button className={page === 'notes' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('notes')}>Нотатки</button>
            <button className={page === 'finance' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('finance')}>Фінанси</button>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Вийти</button>
        </div>
      </header>
      <div className="main-layout">
        {page === 'tasks' ? (
          <aside className="sidebar">
            <h2 className="sidebar-title">Фільтри</h2>
            <div className="sidebar-filters">
              <div className="filter-group">
                <b>Компанія:</b>
                <select value={filter} onChange={e => setFilter(e.target.value)} className="select-company">
                  <option value="all">Всі</option>
                  {COMPANIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {filter !== 'all' && getCompanyBadge(filter)}
              </div>
              <div className="filter-group">
                <b>Пріоритет:</b>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="select-priority">
                  <option value="all">Всі</option>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <b>Статус:</b>
                <select value={doneFilter} onChange={e => setDoneFilter(e.target.value)} className="select-done">
                  {DONE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <button className="add-btn" onClick={() => { setShowModal(true); setEditId(null); setForm({ title: '', company: 'RG', priority: 'medium', description: '', done: false }); }}>+ Додати задачу</button>
            </div>
            <div className="pomodoro-block">
              <h3>Pomodoro</h3>
              <div className={`pomodoro-timer ${pomodoroMode}`} onClick={() => setShowPomodoroSettings(true)} title="Налаштувати час">
                {formatTime(pomodoroTime)}
              </div>
              <div className="pomodoro-status">{pomodoroMode === 'work' ? 'Фокус на задачі' : 'Перерва'}</div>
              <div className="pomodoro-actions">
                {pomodoroRunning ? (
                  <button onClick={stopPomodoro}>Зупинити</button>
                ) : (
                  <button onClick={startPomodoro}>Старт</button>
                )}
                <button onClick={resetPomodoro}>Скинути</button>
              </div>
            </div>
            <button
              className="clear-all-btn"
              style={{marginTop: 'auto', background: '#d32f2f', color: '#fff', borderRadius: 8, padding: '10px 0', fontWeight: 600}}
              onClick={() => setShowClearAllModal(true)}
            >
              Очистити список
            </button>
            {showPomodoroSettings && (
              <div className="modal-backdrop" onClick={() => setShowPomodoroSettings(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <h2>Налаштування Pomodoro</h2>
                  <form className="pomodoro-settings-form" onSubmit={e => { e.preventDefault(); setShowPomodoroSettings(false); }}>
                    <label>
                      Робота:
                      <input type="number" min="1" max="120" value={workMinutes} onChange={e => setWorkMinutes(Math.max(1, Math.min(120, Number(e.target.value))))} /> хв
                    </label>
                    <label>
                      Перерва:
                      <input type="number" min="1" max="60" value={breakMinutes} onChange={e => setBreakMinutes(Math.max(1, Math.min(60, Number(e.target.value))))} /> хв
                    </label>
                    <div className="modal-actions">
                      <button type="submit">OK</button>
                      <button type="button" onClick={() => setShowPomodoroSettings(false)}>Скасувати</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {showClearAllModal && (
              <div className="modal-backdrop" onClick={() => setShowClearAllModal(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <h2>Ви впевнені, що хочете видалити всі задачі?</h2>
                  <div className="modal-actions">
                    <button onClick={handleClearAll}>Так</button>
                    <button type="button" onClick={() => setShowClearAllModal(false)}>Ні</button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        ) : null}
        {page === 'tasks' ? (
          <div className="container">
            <h1 className="main-title">Планувальник задач</h1>
            <table className="tasks-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Назва</th>
                  <th>Компанія/Категорія</th>
                  <th>Пріоритет</th>
                  <th>Опис</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id} className={
                    (task.company === 'learning' ? 'learning-row ' : '') + (task.done ? 'done-task-row' : '')
                  }>
                    <td>
                      <label className="custom-checkbox">
                        <input type="checkbox" checked={!!task.done} onChange={e => handleDone(task.id, e.target.checked)} />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    <td className="task-title-cell">{task.title}</td>
                    <td>{getCompanyBadge(task.company)}</td>
                    <td>{PRIORITIES.find(p => p.value === task.priority)?.label}</td>
                    <td className="task-desc-cell">{task.description}</td>
                    <td>
                      <button className="action-btn edit" onClick={() => handleEdit(task)}>✏️</button>
                      <button className="action-btn delete" onClick={() => handleDelete(task.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {showModal && (
              <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <h2>{editId ? 'Редагувати задачу' : 'Додати задачу'}</h2>
                  <form onSubmit={handleAdd} className="modal-form">
                    <input name="title" value={form.title} onChange={handleChange} placeholder="Назва задачі" required />
                    <select name="company" value={form.company} onChange={handleChange} className="select-company">
                      {COMPANIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <select name="priority" value={form.priority} onChange={handleChange} className="select-priority">
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <input name="description" value={form.description} onChange={handleChange} placeholder="Опис" />
                    <div className="modal-actions">
                      <button type="submit">{editId ? 'Зберегти' : 'Додати'}</button>
                      <button type="button" onClick={() => setShowModal(false)}>Скасувати</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : null}
        {page === 'habits' ? <HabitTracker /> : null}
        {page === 'notes' ? <NotesBoard /> : null}
        {page === 'finance' ? <FinancePlanner /> : null}
      </div>
    </>
  );
}

export default App;
