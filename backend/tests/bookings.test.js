const request = require('supertest');
const app = require('../server');
const pool = require('../db');

describe('Бронирование тренировки', () => {
  beforeAll(async () => {
    // Перед тестами добавляем тестового пользователя
    await pool.query(
      `INSERT INTO users (username, password_hash) 
       VALUES ('testuser', 'hashedpass')`
    );
  });

  afterAll(async () => {
    // Удаляем тестовые данные
    await pool.query(`DELETE FROM bookings WHERE user_id = 999`);
    await pool.query(`DELETE FROM users WHERE username = 'testuser'`);
  });

  it('Создание бронирования', async () => {
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'hashedpass' });
    
    const token = loginRes.body.token;
    
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        trainer_id: 1,
        date: '2025-06-15',
        time: '14:00'
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('booking_id');
  });
});