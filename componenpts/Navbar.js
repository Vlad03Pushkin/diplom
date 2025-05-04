import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    const token = localStorage.getItem('token');
    
    const isAdmin = () => {
        if (!token) return false;
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            return decoded.role === 'admin';
        } catch (err) {
            return false;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <Link to="/">
                    <img src="images/logo.png" alt="Логотип" className="logo" />
                </Link>
            </div>
            <ul>
                <li><Link to="/">Главная</Link></li>
                <li><Link to="/trainers">Наши тренера</Link></li>
                <li><Link to="/reviews">Отзывы</Link></li>
                <li><Link to="/poll">Опрос</Link></li>
                <li><Link to="/consultation">Онлайн-Консультация</Link></li>
                <li><Link to="/booking">Онлайн-Запись</Link></li>
                {!token && (
                    <>
                        <li><Link to="/register">Регистрация</Link></li>
                        <li><Link to="/login">Вход</Link></li>
                    </>
                )}
                {token && (
                    <>
                        <li><Link to="/profile">Профиль</Link></li>
                        {isAdmin() && <li><Link to="/admin">Админка</Link></li>}
                        <li><button onClick={handleLogout}>Выход</button></li>
                    </>
                )}
            </ul>
        </nav>
    );
}

export default Navbar;