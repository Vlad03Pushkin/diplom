import React, { useState, useEffect } from 'react';
import './AdminPage.css';

function AdminPage() {
    const [activeTab, setActiveTab] = useState('bookings');
    const [bookings, setBookings] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Требуется авторизация');

                // Загружаем все данные параллельно
                const [bookingsRes, feedbacksRes, pollsRes] = await Promise.all([
                    fetch('http://localhost:5000/admin/bookings', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }),
                    fetch('http://localhost:5000/admin/feedback', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }),
                    fetch('http://localhost:5000/admin/polls', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                ]);

                if (!bookingsRes.ok || !feedbacksRes.ok || !pollsRes.ok) {
                    throw new Error('Ошибка при загрузке данных');
                }

                const bookingsData = await bookingsRes.json();
                const feedbacksData = await feedbacksRes.json();
                const pollsData = await pollsRes.json();

                setBookings(bookingsData.bookings);
                setFeedbacks(feedbacksData.feedback);
                setPolls(pollsData.polls);
                
            } catch (err) {
                setError(err.message);
                console.error('Admin data fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const updateBookingStatus = async (bookingId, status) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/admin/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Ошибка обновления статуса');

            setBookings(bookings.map(booking => 
                booking.booking_id === bookingId ? { ...booking, status } : booking
            ));
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleFeedbackApproval = async (feedbackId, isApproved) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/admin/feedback/${feedbackId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_approved: isApproved })
            });

            if (!response.ok) throw new Error('Ошибка обновления отзыва');

            setFeedbacks(feedbacks.map(feedback => 
                feedback.feedback_id === feedbackId ? { ...feedback, is_approved: isApproved } : feedback
            ));
        } catch (err) {
            setError(err.message);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString, timeString) => {
        const date = new Date(`${dateString}T${timeString}`);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner"></div>
                <p>Загрузка данных...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-error">
                <h3>Ошибка</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Попробовать снова</button>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Панель администратора</h1>
                <div className="admin-tabs">
                    <button 
                        className={activeTab === 'bookings' ? 'active' : ''}
                        onClick={() => setActiveTab('bookings')}
                    >
                        Записи
                    </button>
                    <button 
                        className={activeTab === 'feedbacks' ? 'active' : ''}
                        onClick={() => setActiveTab('feedbacks')}
                    >
                        Отзывы
                    </button>
                    <button 
                        className={activeTab === 'polls' ? 'active' : ''}
                        onClick={() => setActiveTab('polls')}
                    >
                        Опросы
                    </button>
                </div>
            </div>

            <div className="admin-content">
                {activeTab === 'bookings' && (
                    <div className="bookings-section">
                        <h2>Управление записями</h2>
                        {bookings.length > 0 ? (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Пользователь</th>
                                        <th>Дата и время</th>
                                        <th>Комментарий</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(booking => (
                                        <tr key={booking.booking_id}>
                                            <td>{booking.username}</td>
                                            <td>{formatDateTime(booking.booking_date, booking.booking_time)}</td>
                                            <td>{booking.comments || '-'}</td>
                                            <td>
                                                <span className={`status-${booking.status}`}>
                                                    {booking.status === 'pending' ? 'Ожидание' : 
                                                     booking.status === 'confirmed' ? 'Подтверждено' : 'Отменено'}
                                                </span>
                                            </td>
                                            <td className="actions">
                                                {booking.status !== 'confirmed' && (
                                                    <button 
                                                        className="confirm-btn"
                                                        onClick={() => updateBookingStatus(booking.booking_id, 'confirmed')}
                                                    >
                                                        Подтвердить
                                                    </button>
                                                )}
                                                {booking.status !== 'cancelled' && (
                                                    <button 
                                                        className="cancel-btn"
                                                        onClick={() => updateBookingStatus(booking.booking_id, 'cancelled')}
                                                    >
                                                        Отменить
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>Нет записей для отображения</p>
                        )}
                    </div>
                )}

                {activeTab === 'feedbacks' && (
                    <div className="feedbacks-section">
                        <h2>Управление отзывами</h2>
                        {feedbacks.length > 0 ? (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Пользователь</th>
                                        <th>Дата</th>
                                        <th>Рейтинг</th>
                                        <th>Комментарий</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedbacks.map(feedback => (
                                        <tr key={feedback.feedback_id}>
                                            <td>{feedback.username}</td>
                                            <td>{formatDate(feedback.date_created)}</td>
                                            <td>
                                                <div className="rating-stars">
                                                    {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                                                </div>
                                            </td>
                                            <td>{feedback.comment}</td>
                                            <td>
                                                {feedback.is_approved ? 'Одобрен' : 'На модерации'}
                                            </td>
                                            <td className="actions">
                                                {!feedback.is_approved && (
                                                    <button 
                                                        className="approve-btn"
                                                        onClick={() => toggleFeedbackApproval(feedback.feedback_id, true)}
                                                    >
                                                        Одобрить
                                                    </button>
                                                )}
                                                {feedback.is_approved && (
                                                    <button 
                                                        className="reject-btn"
                                                        onClick={() => toggleFeedbackApproval(feedback.feedback_id, false)}
                                                    >
                                                        Скрыть
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>Нет отзывов для отображения</p>
                        )}
                    </div>
                )}

                {activeTab === 'polls' && (
                    <div className="polls-section">
                        <h2>Результаты опросов</h2>
                        {polls.length > 0 ? (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Пользователь</th>
                                        <th>Дата</th>
                                        <th>Вопрос</th>
                                        <th>Ответ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {polls.map(poll => (
                                        <tr key={poll.poll_id}>
                                            <td>{poll.username}</td>
                                            <td>{formatDate(poll.created_at)}</td>
                                            <td>{poll.question_text}</td>
                                            <td>{poll.answer}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>Нет данных опросов для отображения</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminPage;