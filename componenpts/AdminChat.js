import React, { useState, useEffect } from 'react';
import Chat from './Chat';
import './styles.css';

function AdminChat() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/chat/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) throw new Error('Failed to fetch users');
                
                const data = await response.json();
                setUsers(data);
                
                // Автоматически выбираем первого пользователя, если есть
                if (data.length > 0 && !selectedUser) {
                    setSelectedUser(data[0].user_id);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        if (token) fetchUsers();
    }, [token]);

    return (
        <div className="admin-chat-container">
            <div className="user-list">
                <h3>Пользователи</h3>
                <ul>
                    {users.map(user => (
                        <li 
                            key={user.user_id}
                            className={selectedUser === user.user_id ? 'active' : ''}
                            onClick={() => setSelectedUser(user.user_id)}
                        >
                            {user.username}
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="chat-area">
                {selectedUser ? (
                    <Chat recipientId={selectedUser} />
                ) : (
                    <div className="no-user-selected">
                        Выберите пользователя для начала общения
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminChat;