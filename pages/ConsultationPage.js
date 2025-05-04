import React from 'react';
import Chat from "../components/Chat";
import AdminChat from "../components/AdminChat";
import { getRoleFromToken } from '../utils/auth';

function ConsultationPage() {
    const token = localStorage.getItem('token');
    const role = getRoleFromToken(token);

    return (
        <div className="consultation-page">
            <h1>Страница онлайн-консультаций</h1>
            {role === 'admin' ? <AdminChat /> : <Chat />}
        </div>
    );
}

export default ConsultationPage;