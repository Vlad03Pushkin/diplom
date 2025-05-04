import React, { useEffect } from 'react';
import PollForm from "../components/PollForm";
import './PollPage.css';

function PollPage() {
  useEffect(() => {
    // Проверяем авторизацию при загрузке страницы
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="poll-page">
      <h2>Опрос</h2>
      <p>Пожалуйста, ответьте на несколько вопросов о нашем клубе</p>
      <PollForm />
    </div>
  );
}

export default PollPage;