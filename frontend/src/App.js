
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';


import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDetailPage from './pages/EventDetailPage';
import BookingPage from './pages/BookingPage';
import BookingsPage from './pages/BookingsPage';
import CreateEventPage from './pages/CreateEventPage';
import OrganizerEventsPage from './pages/OrganizerEventsPage';
import AdminDashboard from './pages/AdminDashboard';


import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


const OrganizerRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  

  if (user.role !== 'organizer' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              
              
              <Route 
                path="/booking/:id" 
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/bookings" 
                element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                } 
              />
              
              
              <Route 
                path="/organizer/events" 
                element={
                  <OrganizerRoute>
                    <OrganizerEventsPage />
                  </OrganizerRoute>
                } 
              />
              
              <Route 
                path="/organizer/create-event" 
                element={
                  <OrganizerRoute>
                    <CreateEventPage />
                  </OrganizerRoute>
                } 
              />

              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              
             
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>&copy; 2026 Event Booking System. All rights reserved.</p>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;