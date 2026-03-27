import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDetailPage from './pages/EventDetailPage';
import BookingPage from './pages/BookingPage';
import BookingsPage from './pages/BookingsPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import OrganizerEventsPage from './pages/OrganizerEventsPage';
import OrganizerBookingsPage from './pages/OrganizerBookingsPage';
import AdminDashboard from './pages/AdminDashboard';
import ContactPage from './pages/ContactPage';

import './App.css';


const SaveLastRoute = () => {
  const location = useLocation();

  useEffect(() => {
    if (
      location.pathname !== '/login' &&
      location.pathname !== '/register'
    ) {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location]);

  return null;
};


const AutoRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const lastPath = localStorage.getItem('lastPath');

    if (user) {
      if (
        lastPath &&
        lastPath !== '/' &&
        lastPath !== '/login' &&
        lastPath !== '/register'
      ) {
        navigate(lastPath);
      } else {
        if (user.role === 'organizer') navigate('/organizer/events');
        if (user.role === 'admin') navigate('/admin/dashboard');
      }
    }
  }, [user, loading, navigate]);

  return null;
};


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const OrganizerRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role !== 'organizer') return <Navigate to="/" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};


function App() {
  return (
    <Router>
      <AuthProvider>
        <SaveLastRoute />
        <AutoRedirect />

        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>

              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />

              <Route path="/booking/:id" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />

              <Route path="/organizer/events" element={<OrganizerRoute><OrganizerEventsPage /></OrganizerRoute>} />
              <Route path="/organizer/bookings" element={<OrganizerRoute><OrganizerBookingsPage /></OrganizerRoute>} />
              <Route path="/organizer/create-event" element={<OrganizerRoute><CreateEventPage /></OrganizerRoute>} />
              <Route path="/organizer/edit-event/:id" element={<OrganizerRoute><EditEventPage /></OrganizerRoute>} />

              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

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