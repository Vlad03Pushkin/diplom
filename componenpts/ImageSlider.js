import React from 'react';
import '../App.css';// импортируем стили

function ImageSlider() {
    return (
        <div className="image-slider">
             <img src="images/gym1.jpg" alt="1" className="slider-image"/>
             <img src="images/gym2.jpg" alt="Изображение 2" className="slider-image"/>
        </div>
    );
}

export default ImageSlider;