import React, { useState } from 'react';
import './styles.css';

function ReviewForm() {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
  const handleSubmit = async (event) => {
    event.preventDefault();
       if (!author || !text ) {
            setResponseMessage("Заполните все поля!");
            return;
        }

    try {
        const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ author, text }),
      });

      if (response.ok) {
         setResponseMessage('Отзыв успешно отправлен!');
          setAuthor('');
           setText('');
      } else {
        setResponseMessage('Ошибка при отправке отзыва.');
      }
    } catch (error) {
      console.error('Ошибка:', error);
        setResponseMessage('Ошибка при отправке отзыва.');
    }
  };

  return (
      <form className="review-form" onSubmit={handleSubmit}>
            <label>
                Ваше имя:
                <input type="text" value={author} onChange={e => setAuthor(e.target.value)} />
            </label>
            <label>
                Ваш отзыв:
                <textarea value={text} onChange={e => setText(e.target.value)} />
            </label>
            <button type="submit">Оставить отзыв</button>
          {responseMessage && <p>{responseMessage}</p>}
      </form>
    );
}

export default ReviewForm;