import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    
    // Проверяем, есть ли токен и является ли пользователь администратором
    const isAdmin = () => {
        if (!token) return false;
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            return decoded.role === 'admin';
        } catch (err) {
            return false;
        }
    };

    return isAdmin() ? children : <Navigate to="/" replace />;
};

export default AdminRoute;