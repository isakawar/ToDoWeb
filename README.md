# ToDoQa (Fullstack ToDo App)

## Опис

Це багатосторінковий ToDo-додаток з авторизацією, трекером звичок, нотатками-стікерами, фінансовим планером, діаграмами та сучасним UI. Всі дані зберігаються у MySQL (через Docker volume).

---

## Швидкий старт (Docker Compose)

1. **Клонувати репозиторій та перейти у папку проекту:**
   ```bash
   git clone ...
   cd ToDoQa
   ```
2. **Запустити всі сервіси (backend, frontend, MySQL):**
   ```bash
   docker compose up --build -d
   ```
3. **(Опціонально) Виконати міграцію даних з JSON у MySQL:**
   ```bash
   curl -X POST http://localhost:4000/api/migrate
   ```
4. **Відкрити додаток у браузері:**
   - [http://localhost:3000](http://localhost:3000)

---

## Структура проекту
- `client/` — React фронтенд
- `server.js` — Node.js/Express бекенд
- `db.js` — моделі Sequelize для MySQL
- `data/` — старі JSON-файли (для міграції)
- `docker-compose.yml` — запуск усіх сервісів

---

## Авторизація
- Користувачі зберігаються у MySQL (таблиця `Users`).
- Для тесту можна створити користувача напряму у БД:
  ```sql
  INSERT INTO Users (username, password) VALUES ('Vlad', '1234');
  ```
- Логін працює через `/api/login` (перевіряє MySQL).

---

## Збереження даних
- **Всі дані (задачі, нотатки, звички, фінанси) зберігаються у MySQL**.
- Дані не губляться при перезапуску контейнерів, якщо не видаляти volume:
  - Volume: `db_data` (див. `docker volume ls`)
  - Не видаляй volume через Docker Desktop або `docker compose down -v`!

---

## Міграція старих даних
- Для перенесення даних з JSON у MySQL:
  ```bash
  curl -X POST http://localhost:4000/api/migrate
  ```
- Міграція переносить користувачів, задачі, нотатки, звички, фінанси.

---

## Основні команди
- **Запуск:**
  ```bash
  docker compose up --build -d
  ```
- **Зупинка:**
  ```bash
  docker compose down
  ```
- **Перезапуск backend:**
  ```bash
  docker compose restart backend
  ```
- **Перевірка даних у БД:**
  ```bash
  docker compose exec db mysql -u todoqa -ptodoqa_pass todoqa_db
  ```

---

## Важливо
- Не видаляй volume, якщо хочеш зберегти дані!
- Для бекапу — використовуй `mysqldump` або копіюй volume.
- Паролі зберігаються у відкритому вигляді (демо-режим, не для продакшну).

---

## Автор
- [Твій GitHub/контакти] 