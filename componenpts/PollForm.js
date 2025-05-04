import React, { useState, useEffect } from 'react';
import './PollForm.css';

function PollForm() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/polls/questions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        
        const data = await response.json();
        setQuestions(data);
        
        // Проверяем, отвечал ли пользователь уже на опрос
        const hasAnswered = await checkIfAnswered();
        setIsSubmitted(hasAnswered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const checkIfAnswered = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/polls/questions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const questions = await response.json();
      if (questions.length === 0) return false;

      // Проверяем первый вопрос - если на него ответили, считаем что весь опрос пройден
      const questionId = questions[0].question_id;
      const checkResponse = await fetch(`http://localhost:5000/api/polls/check?question_id=${questionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return checkResponse.ok;
    } catch (err) {
      return false;
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Проверяем, что на все вопросы есть ответы
    if (questions.length !== Object.keys(answers).length) {
      setError('Пожалуйста, ответьте на все вопросы');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Отправляем ответы на все вопросы
      for (const question of questions) {
        const response = await fetch('http://localhost:5000/api/polls/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            question_id: question.question_id,
            answer: answers[question.question_id]
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка при отправке ответа');
        }
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка вопросов...</div>;
  }

  if (isSubmitted) {
    return (
      <div className="poll-thank-you">
        <h3>Спасибо за участие в опросе!</h3>
        <p>Ваши ответы были успешно сохранены.</p>
      </div>
    );
  }

  return (
    <form className="poll-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      {questions.map((question) => (
        <div key={question.question_id} className="poll-question">
          <h4>{question.question_text}</h4>
          <div className="poll-options">
            {['Отлично', 'Хорошо', 'Удовлетворительно', 'Плохо'].map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name={`question_${question.question_id}`}
                  value={option}
                  checked={answers[question.question_id] === option}
                  onChange={() => handleAnswerChange(question.question_id, option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}
      
      <button type="submit" className="submit-button">
        Отправить ответы
      </button>
    </form>
  );
}

export default PollForm;