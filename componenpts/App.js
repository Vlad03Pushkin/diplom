import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TrainersPage from './pages/TrainersPage';
import BookingPage from './pages/BookingPage';
import ReviewsPage from './pages/ReviewsPage';
import PollPage from './pages/PollPage';
import ConsultationPage from "./pages/ConsultationPage";
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute'; // Импортируем AdminRoute
import AdminPage from './pages/AdminPage'; // Импортируем страницу администратора

function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/trainers" element={<TrainersPage />} />
                        <Route path="/booking" element={<BookingPage />} />
                        <Route path="/reviews" element={<ReviewsPage />} />
                        <Route path="/poll" element={<PollPage />} />
                        <Route path="/consultation" element={<ConsultationPage />} />
                        <Route path="/register" element={<RegistrationForm />} />
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <ProfilePage />
                            </PrivateRoute>
                        } />
                        <Route path="/admin" element={
                            <AdminRoute>
                                <AdminPage />
                            </AdminRoute>
                        } />
                    </Routes>
                </main>
                <Footer/>
            </div>
        </Router>
    );
}

export default App;