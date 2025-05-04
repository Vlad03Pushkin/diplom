import React, { useState } from 'react';
import './FeedbackForm.css';

function FeedbackForm({ onSubmit }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!comment.trim()) {
            alert('Введите отзыв');
            return;
        }
        onSubmit({ rating, comment });
        setComment('');
    };

    return (
        <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
                <label htmlFor="rating">Оценка:</label>
                <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                            key={star}
                            className={`star ${star <= rating ? 'filled' : ''}`}
                            onClick={() => setRating(star)}
                        >
                            {star <= rating ? '★' : '☆'}
                        </span>
                    ))}
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="comment">Ваш отзыв:</label>
                <textarea 
                    id="comment" 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Поделитесь вашими впечатлениями"
                    required
                />
            </div>
            <button type="submit" className="submit-button">
                Отправить
            </button>
        </form>
    );
}

export default FeedbackForm;