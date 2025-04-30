const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const app = express();
const port = 5000;
const jwtSecret = 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    password: 'audi1114',
    host: 'localhost',
    database: 'sport_club_db',
    port: 5432,
});

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });
const clients = new Map();
const ADMIN_ID = 8; // ID администратора

wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    const token = new URLSearchParams(req.url.split('?')[1]).get('token');
    
    if (!token) {
        console.log('No token provided');
        ws.close();
        return;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        console.log(`User connected: ${decoded.user_id} (${decoded.role})`);
        
        clients.set(decoded.user_id, ws);
        
        // Отправляем историю сообщений при подключении
        sendInitialMessages(decoded.user_id, ws);

        ws.on('close', () => {
            console.log(`User disconnected: ${decoded.user_id}`);
            clients.delete(decoded.user_id);
        });

        ws.on('error', (error) => {
            console.error(`WS error for user ${decoded.user_id}:`, error);
        });

    } catch (err) {
        console.error('WS token verification failed:', err);
        ws.close();
    }
});

async function sendInitialMessages(userId, ws) {
  try {
      // Для админа загружаем все сообщения
      if (userId === ADMIN_ID) {
          const { rows } = await pool.query(`
              SELECT m.*, u.username as sender_name
              FROM chat_messages m
              JOIN users u ON m.sender_id = u.user_id
              WHERE m.receiver_id = $1 OR m.sender_id = $1
              ORDER BY m.created_at ASC
          `, [ADMIN_ID]);
          
          ws.send(JSON.stringify({
              type: 'initial_messages',
              messages: rows
          }));
      } 
      // Для пользователя загружаем только переписку с админом
      else {
          const { rows } = await pool.query(`
              SELECT m.*, u.username as sender_name
              FROM chat_messages m
              JOIN users u ON m.sender_id = u.user_id
              WHERE (m.sender_id = $1 AND m.receiver_id = $2)
                 OR (m.sender_id = $2 AND m.receiver_id = $1)
              ORDER BY m.created_at ASC
          `, [userId, ADMIN_ID]);
          
          ws.send(JSON.stringify({
              type: 'initial_messages',
              messages: rows
          }));
      }
  } catch (err) {
      console.error('Error sending initial messages:', err);
  }
}
// API Endpoints
app.post('/register', async (req, res) => {
  try {
      const { username, password, email, first_name, last_name, phone_number, date_of_birth, gender } = req.body;

      if (await pool.query('SELECT 1 FROM users WHERE username = $1', [username]).then(res => res.rows.length > 0)) {
          return res.status(400).json({ message: 'Username already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const newUser = await pool.query(
          "INSERT INTO users (username, password_hash, email, first_name, last_name, phone_number, date_of_birth, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id, username, email, first_name, last_name, role",
          [username, password_hash, email, first_name, last_name, phone_number, date_of_birth, gender]
      );

      const token = jwt.sign({ 
          user_id: newUser.rows[0].user_id, 
          username: newUser.rows[0].username, 
          role: newUser.rows[0].role 
      }, jwtSecret, { expiresIn: '1h' });

      res.status(201).json({ user: newUser.rows[0], token });
  } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
  }
});
// Login route
app.post('/login', async (req, res) => {
  try {
      const { username, password } = req.body;
      const user = await pool.query('SELECT user_id, username, password_hash, role FROM users WHERE username = $1', [username]);

      if (user.rows.length === 0) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      if (!await bcrypt.compare(password, user.rows[0].password_hash)) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ 
          user_id: user.rows[0].user_id, 
          username: user.rows[0].username, 
          role: user.rows[0].role 
      }, jwtSecret, { expiresIn: '1h' });

      res.json({ 
          user: {
              user_id: user.rows[0].user_id,
              username: user.rows[0].username,
              role: user.rows[0].role
          }, 
          token 
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});


app.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
      return res.status(401).json({ message: 'No token provided' });
  }

  try {
      const decoded = jwt.verify(token, jwtSecret);
      
      const result = await pool.query(
          'SELECT user_id, username, email, first_name, last_name, phone_number, date_of_birth, gender FROM users WHERE user_id = $1',
          [decoded.user_id]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }

      const user = result.rows[0];
      res.json({ user });
  } catch (err) {
      if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({ message: 'Invalid token' });
      }
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
});



app.get('/api/feedback', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
    f.feedback_id,
    f.rating,
    f.comment,
    f.date_created,
    f.is_approved,
    u.user_id,
    u.username
FROM feedback f
JOIN users u ON f.user_id = u.user_id
ORDER BY f.date_created DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Добавление отзыва (POST)
app.post('/api/feedback', async (req, res) => {
  try {
    const { rating, comment, user_id } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Token required' });

    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.user_id;

    const result = await pool.query(
      `INSERT INTO feedback (user_id, rating, comment) 
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, rating, comment]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/polls/active', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM poll_questions WHERE is_active = TRUE LIMIT 1'
      );
      res.json(rows[0] || null);
    } catch (err) {
      console.error('Poll error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // Отправка ответа на опрос
  app.post('/api/polls/submit', async (req, res) => {
    try {
      const { question_id, answer } = req.body;
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) return res.status(401).json({ error: 'Token required' });
  
      const decoded = jwt.verify(token, jwtSecret);
      const userId = decoded.user_id;
  
      // Проверяем, что пользователь еще не отвечал на этот вопрос
      const existing = await pool.query(
        'SELECT 1 FROM polls WHERE user_id = $1 AND question_id = $2',
        [userId, question_id]
      );
  
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Вы уже участвовали в этом опросе' });
      }
  
      const result = await pool.query(
        `INSERT INTO polls (user_id, question_id, answer) 
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, question_id, answer]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Poll submit error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/polls/questions', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM poll_questions WHERE is_active = TRUE ORDER BY question_id LIMIT 5'
      );
      res.json(rows);
    } catch (err) {
      console.error('Poll questions error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // Отправка ответов
  app.post('/api/polls/submit', async (req, res) => {
    try {
      const { question_id, answer } = req.body;
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) return res.status(401).json({ error: 'Token required' });
  
      const decoded = jwt.verify(token, jwtSecret);
      const userId = decoded.user_id;
  
      // Проверяем существование вопроса
      const questionExists = await pool.query(
        'SELECT 1 FROM poll_questions WHERE question_id = $1',
        [question_id]
      );
      
      if (questionExists.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid question ID' });
      }
  
      // Проверяем, что пользователь еще не отвечал на этот вопрос
      const existing = await pool.query(
        'SELECT 1 FROM polls WHERE user_id = $1 AND question_id = $2',
        [userId, question_id]
      );
  
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Вы уже отвечали на этот вопрос' });
      }
  
      const result = await pool.query(
        `INSERT INTO polls (user_id, question_id, answer) 
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, question_id, answer]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Poll submit error:', err);
      res.status(500).json({ 
        error: 'Database error',
        details: err.message 
      });
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      console.log('Получен запрос на запись:', req.body); // Логируем входящие данные
      
      const { booking_date, booking_time, comments } = req.body;
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        console.log('Отсутствует токен авторизации');
        return res.status(401).json({ error: 'Token required' });
      }
  
      // Проверяем и декодируем токен
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('Ошибка верификации токена:', err);
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      const userId = decoded.user_id;
      console.log(`Создание записи для пользователя ${userId}`);
  
      // Проверка валидности даты и времени
      if (!booking_date || !booking_time) {
        return res.status(400).json({ error: 'Дата и время обязательны' });
      }
  
      // Проверка на существующую запись
      const existing = await pool.query(
        `SELECT 1 FROM bookings 
         WHERE user_id = $1 AND booking_date = $2 AND booking_time = $3`,
        [userId, booking_date, booking_time]
      );
  
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'У вас уже есть запись на это время' });
      }
  
      // Создаем запись
      const result = await pool.query(
        `INSERT INTO bookings (user_id, booking_date, booking_time, comments)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, booking_date, booking_time, comments]
      );
      
      console.log('Запись успешно создана:', result.rows[0]);
      res.status(201).json(result.rows[0]);
      
    } catch (err) {
      console.error('Ошибка при создании записи:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
      });
    }
  });
  
  // Эндпоинт для получения записей пользователя
  app.get('/api/bookings', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token required' });
  
      const decoded = jwt.verify(token, jwtSecret);
      const userId = decoded.user_id;
  
      const { rows } = await pool.query(
        `SELECT booking_id, booking_date, booking_time, comments, status
         FROM bookings 
         WHERE user_id = $1
         ORDER BY booking_date, booking_time`,
        [userId]
      );
      
      res.json(rows);
    } catch (err) {
      console.error('Get bookings error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
async function initializeAdmin() {
  try {
      console.log('Initializing admin user...');
      
      // Принудительно обновляем пароль админа
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin', salt);
      
      await pool.query(`
          INSERT INTO users 
          (username, password_hash, email, first_name, last_name, role)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (username) 
          DO UPDATE SET 
              password_hash = EXCLUDED.password_hash,
              role = EXCLUDED.role
          RETURNING *
      `, [
          'admin', 
          passwordHash, 
          'admin@example.com', 
          'Admin', 
          'User', 
          'admin'
      ]);
      
      console.log('Admin user initialized with password "admin"');
  } catch (err) {
      console.error('Error initializing admin:', err);
  }
}

// Вызываем при старте сервера
initializeAdmin();

app.post('/login', async (req, res) => {
  try {
      console.log('Login attempt for:', req.body.username);
      const { username, password } = req.body;

      // Ищем пользователя
      const user = await pool.query(
          `SELECT user_id, username, password_hash, role 
           FROM users 
           WHERE username = $1`,
          [username]
      );

      console.log('User found:', user.rows.length ? 'Yes' : 'No');
      
      if (user.rows.length === 0) {
          console.log('User not found');
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Сравниваем пароли
      const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
      console.log('Password match:', isMatch);
      
      if (!isMatch) {
          console.log('Password does not match');
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Создаем токен
      const token = jwt.sign(
          { 
              user_id: user.rows[0].user_id, 
              username: user.rows[0].username, 
              role: user.rows[0].role 
          }, 
          jwtSecret, 
          { expiresIn: '1h' }
      );

      console.log('Login successful for:', user.rows[0].username);
      
      res.json({ 
          user: {
              user_id: user.rows[0].user_id,
              username: user.rows[0].username,
              role: user.rows[0].role
          },
          token 
      });

  } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ 
          message: 'Login failed',
          error: err.message 
      });
  }
});

const isAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Требуется авторизация' });

  try {
      const decoded = jwt.verify(token, jwtSecret);
      const user = await pool.query(
          'SELECT role FROM users WHERE user_id = $1',
          [decoded.user_id]
      );
      
      if (user.rows.length === 0 || user.rows[0].role !== 'admin') {
          return res.status(403).json({ message: 'Требуются права администратора' });
      }
      
      next();
  } catch (err) {
      return res.status(403).json({ message: 'Неверный токен' });
  }
};

// Получение всех опросов
app.get('/admin/polls', isAdmin, async (req, res) => {
  try {
      const result = await pool.query(`
          SELECT p.*, u.username 
          FROM polls p
          JOIN users u ON p.user_id = u.user_id
          ORDER BY p.created_at DESC
      `);
      res.json({ polls: result.rows });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение всех отзывов
app.get('/admin/feedback', isAdmin, async (req, res) => {
  try {
      const result = await pool.query(`
          SELECT f.*, u.username 
          FROM feedback f
          JOIN users u ON f.user_id = u.user_id
          ORDER BY f.date_created DESC
      `);
      res.json({ feedback: result.rows });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение всех записей
app.get('/admin/bookings', isAdmin, async (req, res) => {
  try {
      const result = await pool.query(`
          SELECT b.*, u.username 
          FROM bookings b
          JOIN users u ON b.user_id = u.user_id
          ORDER BY b.booking_date DESC, b.booking_time DESC
      `);
      res.json({ bookings: result.rows });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение сообщений
app.get('/api/chat/messages', async (req, res) => {
  try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token required' });

      const decoded = jwt.verify(token, jwtSecret);
      const userId = decoded.user_id;
      const otherUserId = req.query.userId || (decoded.role === 'admin' ? null : ADMIN_ID);

      if (!otherUserId) {
          return res.status(400).json({ error: 'User ID required' });
      }

      const { rows } = await pool.query(`
          SELECT 
              m.message_id,
              m.sender_id,
              m.receiver_id,
              m.message_text,
              m.created_at,
              m.is_read,
              sender.username as sender_name,
              receiver.username as receiver_name
          FROM chat_messages m
          JOIN users sender ON m.sender_id = sender.user_id
          JOIN users receiver ON m.receiver_id = receiver.user_id
          WHERE (m.sender_id = $1 AND m.receiver_id = $2)
             OR (m.sender_id = $2 AND m.receiver_id = $1)
          ORDER BY m.created_at ASC
      `, [userId, otherUserId]);

      res.json(rows);
  } catch (err) {
      console.error('Chat error:', err);
      res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat/send', async (req, res) => {
  try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token required' });

      const { message_text } = req.body;
      const decoded = jwt.verify(token, jwtSecret);
      const sender_id = decoded.user_id;
      
      // Для пользователя всегда отправляем администратору
      let receiver_id = ADMIN_ID;
      
      // Для администратора определяем последнего собеседника
      if (decoded.role === 'admin') {
          receiver_id = await getLastChatPartner(sender_id);
          
          // Если у админа нет истории сообщений, возвращаем ошибку
          if (!receiver_id) {
              return res.status(400).json({ 
                  error: 'Выберите пользователя из списка для начала диалога' 
              });
          }
      }

      // Сохраняем сообщение в БД
      const result = await pool.query(
          `INSERT INTO chat_messages 
           (sender_id, receiver_id, message_text) 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [sender_id, receiver_id, message_text]
      );

      // Получаем полную информацию о сообщении
      const fullMessage = (await pool.query(`
          SELECT m.*, u.username as sender_name
          FROM chat_messages m
          JOIN users u ON m.sender_id = u.user_id
          WHERE m.message_id = $1
      `, [result.rows[0].message_id])).rows[0];

      // Отправляем сообщение обоим участникам
      broadcastMessage(fullMessage);

      res.status(201).json(fullMessage);
  } catch (err) {
      console.error('Send message error:', err);
      res.status(500).json({ 
          error: 'Failed to send message',
          details: err.message 
      });
  }
});
async function getLastChatPartner(adminId) {
  try {
      // Сначала проверяем, есть ли вообще сообщения у админа
      const hasMessages = await pool.query(
          'SELECT 1 FROM chat_messages WHERE sender_id = $1 OR receiver_id = $1 LIMIT 1',
          [adminId]
      );
      
      if (hasMessages.rows.length === 0) {
          return null;
      }

      // Если сообщения есть, находим последнего собеседника
      const result = await pool.query(`
          SELECT 
              CASE 
                  WHEN sender_id = $1 THEN receiver_id 
                  ELSE sender_id 
              END as partner_id
          FROM chat_messages 
          WHERE sender_id = $1 OR receiver_id = $1
          ORDER BY created_at DESC 
          LIMIT 1
      `, [adminId]);
      
      return result.rows[0]?.partner_id;
  } catch (err) {
      console.error('Error in getLastChatPartner:', err);
      return null;
  }
}

function broadcastMessage(message) {
  const messageData = {
      type: 'new_message',
      message: message
  };

  // Отправляем сообщение отправителю и получателю
  [message.sender_id, message.receiver_id].forEach(userId => {
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(messageData));
          console.log(`Message sent to user ${userId}`);
      } else {
          console.log(`User ${userId} not connected`);
      }
  });
}

app.get('/api/chat/users', async (req, res) => {
  try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token required' });

      const decoded = jwt.verify(token, jwtSecret);
      if (decoded.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
      }

      const { rows } = await pool.query(
          `SELECT user_id, username, role 
           FROM users 
           WHERE role = 'user' 
           ORDER BY username`
      );
      res.json(rows);
  } catch (err) {
      console.error('Users list error:', err);
      res.status(500).json({ error: err.message });
  }
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


async function initializeAdmin() {
  try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin', salt);
      
      await pool.query(`
          INSERT INTO users 
          (username, password_hash, email, first_name, last_name, role)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (username) 
          DO UPDATE SET 
              password_hash = EXCLUDED.password_hash,
              role = EXCLUDED.role
      `, ['admin', passwordHash, 'admin@example.com', 'Admin', 'User', 'admin']);
      
      console.log('Admin user initialized');
  } catch (err) {
      console.error('Error initializing admin:', err);
  }
}