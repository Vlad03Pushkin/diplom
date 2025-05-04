import React from 'react';
import './Footer.css'; // Импортируем стили Footer

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p>
                    &copy; {new Date().getFullYear()} Drive Club. Все права защищены.
                </p>
                <div className="contact-info">
                    <p>
                        Телефон: <a href="tel:+77777777777">+7 777 777 77 77</a>
                    </p>
                    <p>
                        Email: <a href="mailto:supportDrive@yandex.ru">supportDrive@yandex.ru</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;