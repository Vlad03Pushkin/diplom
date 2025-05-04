import React, { useState, useEffect } from 'react';
import './TrainerList.css';

const trainers = [
    { id: 1, name: "Иван Иванов", specialization: "Йога", image: 'trainer1.jpg', description: "Сертифицированный инструктор по йоге с 5-летним опытом." },
    { id: 2, name: "Мария Смирнова", specialization: "Тренажерный зал", image: 'trainer2.jpg', description: "Персональный тренер с акцентом на силовые тренировки и набор мышечной массы." },
    { id: 3, name: "Александр Петров", specialization: "Бокс", image: 'trainer3.jpg', description: "Мастер спорта по боксу, обучает технике и тактике боя." },
    { id: 4, name: "Елена Кузнецова", specialization: "Пилатес", image: 'trainer4.jpg', description: "Инструктор по пилатесу, специализируется на укреплении кора и улучшении осанки." },
    { id: 5, name: "Дмитрий Васильев", specialization: "Кроссфит", image: 'trainer5.jpg', description: "Тренер по кроссфиту, помогает улучшить общую физическую подготовку." },
    { id: 6, name: "Михаил Зимаков", specialization: "Пауэрлифтинг", image: 'trainer6.jpg', description: "Профессиональный тяжелоатлет. Разработал собственные эффекстивные программы тренировок. Занимается подготовкой к совернованиям" },
    { id: 7, name: "Олег Смирнов", specialization: "Плавание", image: 'trainer7.jpg', description: "Тренер по плаванию, обучает различным техникам плавания. Специализируется на взрослых и детях." },
    { id: 8, name: "Денис Клевцов", specialization: "Общая физическая подготовка", image: 'trainer8.jpg', description: "Сертифицированный тренер. Занимается подготовкой к различным спортивным нормативам и экзаменам" }
];

function TrainerList() {
    const [activeTrainer, setActiveTrainer] = useState(null);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentIndex = trainers.findIndex(trainer => trainer === activeTrainer);
            const nextIndex = (currentIndex + 1) % trainers.length;
            setActiveTrainer(trainers[nextIndex]);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [activeTrainer]);

    const handleTrainerClick = (trainer) => {
        setActiveTrainer(trainer === activeTrainer ? null : trainer);
    }

    return (
        <div className='trainer-list'>
            <h2>Наши тренера</h2>
            <ul className="trainers-grid">
                {trainers.map(trainer => (
                    <li key={trainer.id} onClick={() => handleTrainerClick(trainer)}
                        className={`trainer-card ${activeTrainer === trainer ? "active-trainer" : ""}`}>
                        <div className="trainer-image">
                            <img src={`/images/${trainer.image}`} alt={trainer.name} />
                        </div>
                        <h3>{trainer.name}</h3>
                        <p>Специализация: {trainer.specialization}</p>
                        <p>{trainer.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TrainerList;