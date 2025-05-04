import React, { useState, useEffect } from 'react';
import './Chat.css';

function Chat({ recipientId = null }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [ws, setWs] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) return;

        const socket = new WebSocket(`ws://localhost:8080?token=${token}`);
        
        socket.onopen = () => {
            console.log('WebSocket connected');
            setWs(socket);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'initial_messages') {
                setMessages(data.messages);
            } else if (data.type === 'new_message') {
                setMessages(prev => [...prev, data.message]);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
            setWs(null);
        };

        return () => {
            if (socket.readyState === 1) {
                socket.close();
            }
        };
    }, [token]);

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || !ws) return;

        try {
            const response = await fetch('http://localhost:5000/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message_text: message,
                    ...(recipientId && { recipientId })
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((msg) => (
                    <div 
                        key={msg.message_id} 
                        className={`message ${msg.sender_id === getUserIdFromToken(token) ? 'sent' : 'received'}`}
                    >
                        <div className="message-text">{msg.message_text}</div>
                        <div className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
            </div>
            
            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Введите сообщение..."
                    disabled={!ws}
                />
                <button type="submit" disabled={!ws || !message.trim()}>
                    Отправить
                </button>
            </form>
        </div>
    );
}

function getUserIdFromToken(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        return payload.user_id;
    } catch (e) {
        console.error('Error decoding token:', e);
        return null;
    }
}

export default Chat;