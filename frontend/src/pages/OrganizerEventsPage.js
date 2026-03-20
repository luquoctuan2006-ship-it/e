import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizerAPI } from '../services/api';
import '../styles/OrganizerEventsPage.css';

const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, navigate]);
  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getMyEvents();
      setEvents(response.events || []);
    } catch (err) {
      setError('Không thể tải danh sách sự kiện');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải danh sách sự kiện...</p>
      </div>
    );
  }

  return (
    <div className="organizer-events-page">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1> Quản lý sự kiện</h1>
            <p className="subtitle">Quản lý tất cả sự kiện của bạn tại đây</p>
          </div>
          <Link to="/organizer/create-event" className="btn btn-primary create-btn">
             Tạo sự kiện mới
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Lỗi:</strong> {error}
          </div>
        )}
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3>Chưa có sự kiện nào</h3>
            <p>Hãy tạo sự kiện đầu tiên của bạn để bắt đầu bán vé!</p>
            <Link to="/organizer/create-event" className="btn btn-primary">
              Tạo sự kiện đầu tiên
            </Link>
          </div>
        ) : (
          <div className="events-table-container">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Ngày sự kiện</th>
                  <th>Trạng thái</th>
                  <th>Vé đã bán</th>
                  <th>Giá vé</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td className="event-title">
                      <strong>{event.title}</strong>
                      <small>{event.venue_name} - {event.city}</small>
                    </td>
                    <td>
                      {new Date(event.event_date).toLocaleDateString('vi-VN')}
                      <br />
                      <small>{new Date(event.event_date).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</small>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </span>
                    </td>
                    <td>
                      {event.sold_tickets || 0} / {event.total_tickets}
                      <br />
                      <small>{event.total_tickets - (event.sold_tickets || 0)} vé còn lại</small>
                    </td>
                    <td>
                      {event.price.toLocaleString('vi-VN')} VND
                    </td>
                    <td className="actions">
                      <button 
                        className="btn btn-small btn-edit"
                        onClick={() => navigate(`/organizer/edit-event/${event.id}`)}
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {events.length > 0 && (
          <div className="quick-stats">
            <div className="stat-card">
              <h3>{events.length}</h3>
              <p>Tổng sự kiện</p>
            </div>
            <div className="stat-card">
              <h3>{events.filter(e => e.status === 'approved').length}</h3>
              <p>Đã duyệt</p>
            </div>
            <div className="stat-card">
              <h3>{events.filter(e => e.status === 'pending').length}</h3>
              <p>Chờ duyệt</p>
            </div>
            <div className="stat-card">
              <h3>{events.reduce((sum, e) => sum + (e.sold_tickets || 0), 0)}</h3>
              <p>Vé đã bán</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerEventsPage;