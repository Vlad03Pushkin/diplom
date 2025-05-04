import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

function ProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }

                const response = await fetch('http://localhost:5000/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch profile');
                }

                const data = await response.json();
                setUser(data.user);
            } catch (error) {
                setError(error.message);
                console.error('Profile fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    const formatPhone = (phone) => {
        if (!phone) return 'Не указано';
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="spinner"></div>
                <p>Загрузка профиля...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-error">
                <h3>Ошибка</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Попробовать снова</button>
            </div>
        );
    }

    if (!user) {
        return <div className="profile-empty">Данные пользователя не найдены</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h2>Мой профиль</h2>
                <div className="profile-avatar">
                    {user.first_name && user.last_name 
                        ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
                        : user.username.charAt(0).toUpperCase()}
                </div>
            </div>

            <div className="profile-details">
                <div className="profile-section">
                    <h3>Основная информация</h3>
                    <div className="profile-row">
                        <span className="profile-label">Логин:</span>
                        <span className="profile-value">{user.username}</span>
                    </div>
                    <div className="profile-row">
                        <span className="profile-label">Email:</span>
                        <span className="profile-value">{user.email || 'Не указан'}</span>
                    </div>
                    <div className="profile-row">
                        <span className="profile-label">Имя:</span>
                        <span className="profile-value">{user.first_name || 'Не указано'}</span>
                    </div>
                    <div className="profile-row">
                        <span className="profile-label">Фамилия:</span>
                        <span className="profile-value">{user.last_name || 'Не указано'}</span>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Контактные данные</h3>
                    <div className="profile-row">
                        <span className="profile-label">Телефон:</span>
                        <span className="profile-value">{formatPhone(user.phone_number)}</span>
                    </div>
                    <div className="profile-row">
                        <span className="profile-label">Дата рождения:</span>
                        <span className="profile-value">{formatDate(user.date_of_birth)}</span>
                    </div>
                    <div className="profile-row">
                        <span className="profile-label">Пол:</span>
                        <span className="profile-value">
                            {user.gender === 'male' ? 'Мужской' : 
                             user.gender === 'female' ? 'Женский' : 'Не указан'}
                        </span>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Статус</h3>
                    <div className="profile-row">
                        <span className="profile-label">Роль:</span>
                        <span className="profile-value">
                            {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                        </span>
                    </div>
                    <div className="profile-row">
                        <span className="profile-label">Статус аккаунта:</span>
                        <span className="profile-value">
                            {user.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;