import React, { useState, useEffect } from 'react';
import BookingForm from "../components/BookingForm";
import './BookingPage.css';

function BookingPage() {
    const [userBookings, setUserBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserBookings = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const response = await fetch('http://localhost:5000/api/bookings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setUserBookings(data);
                }
            } catch (err) {
                console.error('Error fetching bookings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserBookings();
    }, []);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="booking-page">
            <div className="booking-header">
                <h1>Онлайн-запись</h1>
                <p>Запишитесь на удобное для вас время</p>
            </div>
            
            <div className="booking-content">
                <BookingForm />
                
                <div className="user-bookings">
                    <h3>Мои записи</h3>
                    {loading ? (
                        <p>Загрузка ваших записей...</p>
                    ) : userBookings.length > 0 ? (
                        <ul>
                            {userBookings.map((booking) => (
                                <li key={booking.booking_id} className="booking-item">
                                    <div className="booking-date">
                                        {formatDate(booking.booking_date)}, {booking.booking_time}
                                    </div>
                                    <div className="booking-status">
                                        Статус: <span className={`status-${booking.status}`}>
                                            {booking.status === 'pending' ? 'Ожидание' : 
                                             booking.status === 'confirmed' ? 'Подтверждено' : 'Отменено'}
                                        </span>
                                    </div>
                                    {booking.comments && (
                                        <div className="booking-comments">
                                            Комментарий: {booking.comments}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>У вас пока нет активных записей</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookingPage;