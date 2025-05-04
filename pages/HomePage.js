import React, { useState, useEffect, useCallback } from 'react';
import './HomePage.css';

function HomePage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [prevSlide, setPrevSlide] = useState(null);
    const slideData = [
        {
            title: 'Преимущества нашего клуба',
            text: 'Спортивный клуб "Драйв" - это место, где вы сможете достичь своих фитнес-целей, укрепить здоровье и найти новых друзей. Мы предлагаем современное оборудование, профессиональных тренеров и комфортную атмосферу для эффективных тренировок.',
            image: 'slider1.jpg',
        },
        {
            title: 'Уникальные акции',
            text: 'Получите годовой абонемент по выгодной цене и скидку 10% при первом посещении нашего клуба! Не упустите шанс начать тренироваться с максимальной выгодой.',
            image: 'slider2.jpg',
        },
        {
            title: 'Скидка в День Рождения',
            text: 'Приходите к нам в свой День Рождения и получите скидку 15% на абонемент, а также приятный подарок от нашей компании! Сделайте свой праздник незабываемым.',
            image: 'slider3.jpg',
        },
        {
            title: 'О нас',
            text: '"Драйв" — это современный спортивный клуб, предлагающий широкий спектр занятий для любого уровня подготовки. От групповых тренировок до индивидуальных занятий с тренером — мы поможем вам достичь желаемых результатов. Присоединяйтесь к нашей команде!',
            image: 'slider4.jpg',
        },
    ];

    const nextSlide = useCallback(() => {
        setPrevSlide(currentSlide);
        setCurrentSlide((oldSlide) => (oldSlide + 1) % slideData.length);
    }, [slideData.length, currentSlide, setPrevSlide]);

    const prevSlideFunc = useCallback(() => {
        setPrevSlide(currentSlide);
        setCurrentSlide((oldSlide) => (oldSlide - 1 + slideData.length) % slideData.length);
    }, [slideData.length, currentSlide, setPrevSlide]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            nextSlide();
        }, 12000);

        return () => clearInterval(intervalId);
    }, [nextSlide]);

    return (
        <div className="home-page">
            <div className="slider-container">
                <button className="slider-button slider-button-prev" onClick={prevSlideFunc}>&lt;</button>
                {slideData.map((slide, index) => (
                    <div
                        key={index}
                        className={`slide ${index === currentSlide ? 'active' : ''} ${index === prevSlide ? 'hidden' : ''}`} // Добавили класс hidden
                        style={{ display: index === currentSlide ? 'flex' : 'none' }}
                    >
                        <div className="slide-text">
                            <h2>{slide.title}</h2>
                            <p>{slide.text}</p>
                        </div>
                        <div className="slide-image">
                            <img src={`/images/${slide.image}`} alt={slide.title} />
                        </div>
                    </div>
                ))}
                <button className="slider-button slider-button-next" onClick={nextSlide}>&gt;</button>
            </div>
        </div>
    );
}

export default HomePage;