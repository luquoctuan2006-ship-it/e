import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/EventDetailPage.css';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isPastEvent = event ? new Date(event.event_date) < new Date() : false;
  const availableTickets = event
    ? (event.available_tickets ?? (event.capacity - (event.total_bookings || 0)))
    : 0;
  const isSoldOut = availableTickets <= 0;
  const eventPrice = Number(event?.price || 0);

  const fetchEventDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventsAPI.getById(id);
      if (!data || !data.event) throw new Error('tìm không thấy sự kiện');
      setEvent(data.event);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const handleBooking = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isPastEvent) {
      alert('Sự kiện đã kết thúc');
      return;
    }

    if (isSoldOut) {
      alert('Sự kiện đã hết vé');
      return;
    }

    navigate(`/booking/${id}`);
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!event) return <div className="error-message">Sự kiện không tìm thấy</div>;

  return (
    <div className="event-detail">
      <div className="event-header">
        <h1>{event.title}</h1>
        <p className="event-date">
          {new Date(event.event_date).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {isPastEvent && (
          <span className="badge badge-past">Đã kết thúc</span>
        )}
        {isSoldOut && !isPastEvent && (
          <span className="badge badge-soldout">Hết vé</span>
        )}
      </div>

      <div className="event-content">
        <div className="event-main">
          <div className="event-info">
            <h3>Thông tin sự kiện</h3>
            <p><strong>Mô tả:</strong> {event.description}</p>
            <p><strong>Địa điểm:</strong> {event.venue_name}, {event.city}</p>
            <p><strong>Danh mục:</strong> {event.category_name}</p>
            <p><strong>Tổ chức bởi:</strong> {event.organizer_name}</p>
            <p><strong>Sức chứa:</strong> {event.capacity} chỗ</p>
            <p><strong>Đã đặt:</strong> {event.total_bookings || 0} vé</p>
            <p>
              <strong>Còn lại:</strong>{' '}
              <span className={availableTickets <= 10 ? 'text-warning' : ''}>
                {availableTickets} vé
              </span>
            </p>
          </div>

          <div className="event-booking">
            <div className="price">
              <span className="label">Giá vé</span>
              <span className="amount">
                {eventPrice.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
            <button
              className="booking-btn"
              onClick={handleBooking}
              disabled={isPastEvent || isSoldOut}
            >
              {isPastEvent
                ? 'Sự kiện đã kết thúc'
                : isSoldOut
                  ? 'Đã hết vé'
                  : isAuthenticated
                    ? 'Đặt vé ngay'
                    : 'Đăng nhập để đặt vé'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;