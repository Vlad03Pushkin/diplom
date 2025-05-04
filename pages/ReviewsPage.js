import React, { useState, useEffect } from 'react';
import FeedbackForm from '../components/FeedbackForm';

function ReviewsPage() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Проверяем авторизацию пользователя при загрузке компонента
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Декодируем токен для получения информации о пользователе
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    userId: decoded.user_id,
                    username: decoded.username
                });
            } catch (err) {
                console.error('Error decoding token:', err);
            }
        }

        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/feedback'); 
            if (!response.ok) {
                throw new Error('Failed to fetch feedbacks');
            }
            const data = await response.json();
            setFeedbacks(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFeedback = async (feedback) => {
        if (!user) {
            setError('You need to login to submit feedback');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    rating: feedback.rating,
                    comment: feedback.comment
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            const newFeedback = await response.json();
            setFeedbacks([newFeedback, ...feedbacks]);
            setError('');
        } catch (error) {
            setError(error.message);
            console.error('Error submitting feedback:', error);
        }
    };

    if (loading) {
        return <div className="loading">Загружаем отзывы...</div>;
    }

    return (
        <div className="reviews-container">
            <h2>Отзывы</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            {/* Форма для отправки отзыва */}
            {user ? (
                <div className="feedback-section">
                    <FeedbackForm onSubmit={handleSubmitFeedback} />
                </div>
            ) : (
                <div className="login-prompt">
                    <p>Пожалуйста <a href="/login">войдите </a> чтобы оставить отзыв.</p>
                </div>
            )}
            
            {/* Список отзывов */}
            <div className="feedbacks-list">
                <h3>Все отзывы</h3>
                {feedbacks.length === 0 ? (
                    <p>Здесь пусто.Оставьте отзыв первым!</p>
                ) : (
                    feedbacks.map((feedback) => (
                        <div 
                            key={feedback.feedback_id} 
                            className={`feedback-item ${user && user.userId === feedback.user_id ? 'my-feedback' : ''}`}
                        >
                            <div className="feedback-header">
                                <span className="feedback-user">{feedback.username || 'Anonymous'}</span>
                                <span className="feedback-rating">
                                    {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                                </span>
                                <span className="feedback-date">
                                    {new Date(feedback.date_created).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="feedback-comment">
                                {feedback.comment}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ReviewsPage;