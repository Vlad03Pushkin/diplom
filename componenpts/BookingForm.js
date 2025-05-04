import React, { useState, useEffect } from 'react';
import './BookingForm.css';

function BookingForm() {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [comments, setComments] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Загрузка доступных времен для выбранной даты
    useEffect(() => {
        if (date) {
            // Здесь можно добавить запрос к API для получения занятых слотов
            // и вычисления доступного времени
            const times = [];
            for (let hour = 9; hour < 21; hour++) {
                times.push(`${hour}:00`, `${hour}:30`);
            }
            setAvailableTimes(times);
        }
    }, [date]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!date || !time) {
            setMessage({ text: 'Пожалуйста, выберите дату и время', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Требуется авторизация');

            const response = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    booking_date: date,
                    booking_time: time,
                    comments
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при создании записи');
            }

            //const data = await response.json();
            setMessage({ 
                text: 'Запись успешно создана!', 
                type: 'success' 
            });
            
            // Очищаем форму после успешной отправки
            setDate('');
            setTime('');
            setComments('');
            
        } catch (err) {
            console.error('Booking error:', err);
            setMessage({ 
                text: err.message, 
                type: 'error' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Генерация списка доступных дат (начиная с сегодняшнего дня)
    const generateAvailableDates = () => {
        const dates = [];
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        return dates;
    };

    return (
        <div className="booking-container">
            <form onSubmit={handleSubmit} className="booking-form">
                <h3>Записаться на тренировку</h3>
                
                <div className="form-group">
                    <label htmlFor="date">Дата:</label>
                    <select
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    >
                        <option value="">Выберите дату</option>
                        {generateAvailableDates().map((date) => (
                            <option key={date} value={date}>
                                {new Date(date).toLocaleDateString('ru-RU', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="time">Время:</label>
                    <select
                        id="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        disabled={!date}
                        required
                    >
                        <option value="">Выберите время</option>
                        {availableTimes.map((time) => (
                            <option key={time} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="comments">Комментарий:</label>
                    <textarea
                        id="comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Укажите тип тренировки или пожелания"
                    />
                </div>
                
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}
                
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="submit-btn"
                >
                    {isSubmitting ? 'Отправка...' : 'Записаться'}
                </button>
            </form>
        </div>
    );
}

export default BookingForm;